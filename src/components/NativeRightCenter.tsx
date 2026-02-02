/**
 * NativeRightCenter - Native implementation of Rights Center
 * Replaces WebView with native React Native components
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import RightsCenterApi, {
  ConsentGroup,
  DPOInfo,
  Nominee,
  GrievanceTicket,
  ConsentPayload,
} from '../services/rightsCenterApi';

export interface NativeRightCenterProps {
  userId: string;
  apiKey?: string;
  organizationId?: string;
  apiBaseUrl?: string;
}

const tabs = ['Consent', 'Rights', 'Transparency', 'DPO', 'Nominee', 'Grievance'];

export default function NativeRightCenter({
  userId,
  apiKey = '',
  organizationId = 'mars-money',
  apiBaseUrl = 'https://rdwcymn5poo6zbzg5fa5xzjsqy0zzcpm.lambda-url.ap-south-1.on.aws/banners',
}: NativeRightCenterProps) {
  const [activeTab, setActiveTab] = useState('Consent');
  const [api] = useState(() => new RightsCenterApi(apiBaseUrl, apiKey, organizationId));
  
  // Consent state
  const [consentGroups, setConsentGroups] = useState<ConsentGroup[]>([]);
  const [initialConsentGroups, setInitialConsentGroups] = useState<ConsentGroup[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // Rights state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  
  // DPO state
  const [dpoInfo, setDpoInfo] = useState<DPOInfo | null>(null);
  const [dpoLoading, setDpoLoading] = useState(true);
  const [dpoError, setDpoError] = useState<string | null>(null);
  
  // Nominee state
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [nomineeLoading, setNomineeLoading] = useState(true);
  const [nomineeError, setNomineeError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [nomineeForm, setNomineeForm] = useState({
    nominee_name: '',
    relationship: '',
    nominee_email: '',
    nominee_mobile: '',
    purpose_of_appointment: '',
  });
  
  // Grievance state
  const [tickets, setTickets] = useState<GrievanceTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [showGrievanceForm, setShowGrievanceForm] = useState(false);
  const [grievanceForm, setGrievanceForm] = useState({
    subject: '',
    category: '',
    description: '',
  });

  // Fetch consents - matches web package logic exactly
  const fetchUserConsents = async () => {
    setConsentsLoading(true);
    try {
      console.log('[NativeRightCenter] Fetching consents for user:', userId);
      console.log('[NativeRightCenter] Starting dual fetch: /user/{userId} and getAllBanners()');
      
      const [userRecords, allBanners] = await Promise.all([
        api.getUserConsents(userId).catch((err) => {
          console.warn('[NativeRightCenter] Error fetching user consents, using empty array:', err);
          return [];
        }),
        api.getAllBanners().catch((err) => {
          console.warn('[NativeRightCenter] Error fetching all banners, using empty array:', err);
          return [];
        }),
      ]);

      console.log('[NativeRightCenter] Data received - User records:', Array.isArray(userRecords) ? userRecords.length : 0, 'All banners:', Array.isArray(allBanners) ? allBanners.length : 0);

      // Create map of user records by collection_point (matches web package line 227-230)
      const userByCp = new Map();
      (Array.isArray(userRecords) ? userRecords : []).forEach((cp: ConsentGroup) => {
        userByCp.set(cp.collection_point, cp);
      });

      console.log('[NativeRightCenter] User records mapped to', userByCp.size, 'collection points');

      // Merge all banners with user-specific status (matches web package line 232-258)
      const merged = (Array.isArray(allBanners) ? allBanners : []).map((cp: ConsentGroup) => {
        const userCp = userByCp.get(cp.collection_point);
        const shown_to_principal = !!userCp?.shown_to_principal;
        
        // Only keep explicit statuses from user (accepted/declined). Ignore 'pending' (matches web package line 237-242)
        const userPurposeStatus = new Map(
          (userCp?.purposes || [])
            .map((p: any) => ({ id: p.id, consented: normalizeStatus(p.consented) }))
            .filter((p: any) => p.consented === 'accepted' || p.consented === 'declined')
            .map((p: any) => [p.id, p.consented])
        );
        
        // Map purposes and determine status (matches web package line 243-256)
        const purposes = (cp.purposes || []).map((p: any) => {
          const hasUser = userPurposeStatus.has(p.id);
          let status;
          if (hasUser) {
            // User has explicit status
            status = userPurposeStatus.get(p.id);
          } else if (shown_to_principal) {
            // If the collection point was shown and user has no explicit status logged for this purpose,
            // treat it as accepted (implicit approval at time of show) - matches web package line 248-251
            status = 'accepted';
          } else {
            // Default to declined if not shown and no user status
            status = normalizeStatus(p.consented) ?? 'declined';
          }
          return { ...p, consented: status };
        });
        
        return { ...cp, purposes, shown_to_principal };
      });

      console.log('[NativeRightCenter] Merged result:', merged.length, 'collection points');
      if (merged.length > 0) {
        const totalPurposes = merged.reduce((sum, cp) => sum + (cp.purposes?.length || 0), 0);
        console.log('[NativeRightCenter] Total purposes across all collection points:', totalPurposes);
      }

      setConsentGroups(merged);
      setInitialConsentGroups(JSON.parse(JSON.stringify(merged)));
      console.log('[NativeRightCenter] Consents loaded successfully:', merged.length, 'groups');
    } catch (error: any) {
      console.error('[NativeRightCenter] Error fetching consents:', error);
      // Don't show alert, just log and set empty state
      setConsentGroups([]);
      setInitialConsentGroups([]);
    } finally {
      setConsentsLoading(false);
    }
  };

  const normalizeStatus = (val: any): 'accepted' | 'declined' | 'pending' => {
    if (val === 'accepted' || val === 'declined') return val;
    if (val === 'approved') return 'accepted';
    if (val === 'rejected') return 'declined';
    if (typeof val === 'boolean') return val ? 'accepted' : 'declined';
    if (typeof val === 'string') {
      const v = val.toLowerCase();
      if (v === 'yes' || v === 'true') return 'accepted';
      if (v === 'no' || v === 'false') return 'declined';
    }
    return 'pending';
  };

  // Fetch DPO
  const fetchDPO = async () => {
    setDpoLoading(true);
    setDpoError(null);
    try {
      const info = await api.getDPOInfo().catch((err) => {
        console.warn('[NativeRightCenter] Error fetching DPO, using null:', err);
        return null;
      });
      setDpoInfo(info);
    } catch (error: any) {
      console.error('[NativeRightCenter] Error fetching DPO:', error);
      setDpoError('Failed to load DPO information');
      setDpoInfo(null);
    } finally {
      setDpoLoading(false);
    }
  };

  // Fetch nominees
  const fetchNominees = async () => {
    setNomineeLoading(true);
    setNomineeError(null);
    try {
      const data = await api.getNominees(userId).catch((err) => {
        console.warn('[NativeRightCenter] Error fetching nominees, using empty array:', err);
        return [];
      });
      setNominees(data);
      if (data.length > 0) {
        const n = data[0];
        setNomineeForm({
          nominee_name: n.nominee_name || '',
          relationship: n.relationship || '',
          nominee_email: n.nominee_email || '',
          nominee_mobile: n.nominee_mobile || '',
          purpose_of_appointment: n.purpose_of_appointment || '',
        });
      }
    } catch (error: any) {
      console.error('[NativeRightCenter] Error fetching nominees:', error);
      setNomineeError('Failed to load nominee information');
      setNominees([]);
    } finally {
      setNomineeLoading(false);
    }
  };

  // Fetch grievances
  const fetchGrievances = async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const data = await api.getGrievanceTickets(userId).catch((err) => {
        console.warn('[NativeRightCenter] Error fetching grievances, using empty array:', err);
        return [];
      });
      setTickets(data);
    } catch (error: any) {
      console.error('[NativeRightCenter] Error fetching grievances:', error);
      setTicketsError('Failed to load grievance tickets');
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserConsents();
    fetchDPO();
    fetchNominees();
    fetchGrievances();
  }, [userId]);

  // Consent handlers
  const handleToggle = (consentId: string, collectionId: string) => {
    setConsentGroups((prev) =>
      prev.map((cp) =>
        cp.collection_point === collectionId
          ? {
              ...cp,
              purposes: (cp.purposes || []).map((p) =>
                p.id === consentId
                  ? { ...p, consented: p.consented === 'accepted' ? 'declined' : 'accepted' }
                  : p
              ),
            }
          : cp
      )
    );
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      const initialStateByCollection = new Map();
      initialConsentGroups.forEach((cp) => {
        const purposeMap = new Map();
        (cp.purposes || []).forEach((p) => {
          purposeMap.set(p.id, p.consented);
        });
        initialStateByCollection.set(cp.collection_point, purposeMap);
      });

      const byCollection: Record<string, any[]> = {};
      const changedByCollection: Record<string, string[]> = {};

      consentGroups.forEach((cp) => {
        (cp.purposes || []).forEach((p) => {
          if (!byCollection[cp.collection_point]) {
            byCollection[cp.collection_point] = [];
            changedByCollection[cp.collection_point] = [];
          }
          byCollection[cp.collection_point].push(p);

          const collectionInitialState = initialStateByCollection.get(cp.collection_point);
          const initialStatus = collectionInitialState?.get(p.id);
          const safeInitial = initialStatus || 'declined';

          if (safeInitial !== p.consented) {
            changedByCollection[cp.collection_point].push(p.id);
          }
        });
      });

      await Promise.all(
        Object.entries(byCollection)
          .filter(([collectionId]) => changedByCollection[collectionId]?.length > 0)
          .map(([collectionId, list]) => {
            const changedIds = new Set(changedByCollection[collectionId] || []);
            const collectionInitialState = initialStateByCollection.get(collectionId);

            const purposesPayload = list
              .filter((p) => changedIds.has(p.id))
              .map((p) => {
                const initialStatus = collectionInitialState?.get(p.id) || 'declined';
                return {
                  id: p.id,
                  name: p.name,
                  consented: p.consented,
                  initialStatus,
                };
              });

            const hasRevocation = purposesPayload.some(
              (p: any) => p.initialStatus === 'accepted' && p.consented === 'declined'
            );
            const hasApproval = purposesPayload.some((p: any) => p.consented === 'accepted');

            const action = hasRevocation ? 'revoked' : hasApproval ? 'approved' : 'declined';

            const payload: ConsentPayload = {
              userId,
              purposes: purposesPayload.map(({ initialStatus, ...rest }: any) => rest),
              action: action as 'approved' | 'revoked' | 'declined',
            };

            if (changedByCollection[collectionId]?.length > 0) {
              (payload as any).changedPurposes = changedByCollection[collectionId];
            }

            return api.saveConsent(collectionId, payload);
          })
      );

      setDirty(false);
      setShowSaveModal(true);
      // Refresh consents after save - errors are handled gracefully in fetchUserConsents
      fetchUserConsents().catch((err) => {
        // Silently handle refresh errors - save was successful
        console.log('[NativeRightCenter] Note: Error refreshing consents after save (this is non-critical):', err);
      });
    } catch (error: any) {
      console.error('[NativeRightCenter] Error saving consents:', error);
      Alert.alert('Error', 'Failed to save consent changes. Please try again.');
    }
  };

  // Nominee handlers
  const handleNomineeSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    const nominee = nominees[0];
    const payload: Nominee = {
      user_id: userId,
      ...nomineeForm,
    };

    try {
      if (nominee && editing && nominee.id) {
        const updated = await api.updateNominee(nominee.id, payload);
        setNominees([updated]);
      } else {
        const created = await api.createNominee(payload);
        setNominees([created]);
      }
      setEditing(false);
      Alert.alert('Success', 'Nominee saved successfully');
    } catch (error: any) {
      console.error('[NativeRightCenter] Error saving nominee:', error);
      Alert.alert('Error', 'Failed to save nominee. Please try again.');
    }
  };

  const handleDeleteNominee = async () => {
    const nominee = nominees[0];
    if (!nominee?.id) return;

    Alert.alert(
      'Delete Nominee',
      'Are you sure you want to delete this nominee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteNominee(nominee.id!);
              setNominees([]);
              setNomineeForm({
                nominee_name: '',
                relationship: '',
                nominee_email: '',
                nominee_mobile: '',
                purpose_of_appointment: '',
              });
              Alert.alert('Success', 'Nominee deleted successfully');
            } catch (error: any) {
              console.error('[NativeRightCenter] Error deleting nominee:', error);
              Alert.alert('Error', 'Failed to delete nominee. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Grievance handlers
  const handleGrievanceSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    const payload: GrievanceTicket = {
      client_user_id: userId,
      subject: grievanceForm.subject,
      category: grievanceForm.category,
      description: grievanceForm.description,
    };

    try {
      const created = await api.createGrievanceTicket(payload);
      setTickets((prev) => [created, ...prev]);
      setShowGrievanceForm(false);
      setGrievanceForm({ subject: '', category: '', description: '' });
      Alert.alert('Success', 'Grievance ticket created successfully');
    } catch (error: any) {
      console.error('[NativeRightCenter] Error creating grievance:', error);
      Alert.alert('Error', 'Failed to create grievance ticket. Please try again.');
    }
  };

  const handleDeleteRequest = () => {
    setDeleteConfirmed(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setDeleteConfirmed(false);
    }, 1500);
  };

  const nominee = nominees[0] || null;

  return (
    <View style={styles.container}>
      {/* Data Principal ID Banner */}
      <View style={styles.principalBanner}>
        <Text style={styles.principalText}>Data Principal ID: {userId.slice(0, 6)}</Text>
      </View>

      {/* Tabs Navigation - Wrapped in 2 rows (3+3) */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {tabs.slice(0, 3).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tabsRow}>
          {tabs.slice(3, 6).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'Consent' && (
          <ConsentTab
            consentGroups={consentGroups}
            consentsLoading={consentsLoading}
            dirty={dirty}
            onToggle={handleToggle}
            onSave={handleSave}
            onInfoClick={setModalData}
          />
        )}

        {activeTab === 'Rights' && (
          <RightsTab
            showDeleteModal={showDeleteModal}
            deleteConfirmed={deleteConfirmed}
            onDeleteRequest={handleDeleteRequest}
            onCloseModal={() => setShowDeleteModal(false)}
            onOpenModal={() => setShowDeleteModal(true)}
          />
        )}

        {activeTab === 'Transparency' && <TransparencyTab />}

        {activeTab === 'DPO' && (
          <DPOTab dpoInfo={dpoInfo} loading={dpoLoading} error={dpoError} />
        )}

        {activeTab === 'Nominee' && (
          <NomineeTab
            nominee={nominee}
            editing={editing}
            nomineeForm={nomineeForm}
            loading={nomineeLoading}
            error={nomineeError}
            onFormChange={setNomineeForm}
            onSubmit={handleNomineeSubmit}
            onEdit={() => setEditing(true)}
            onCancel={() => setEditing(false)}
            onDelete={handleDeleteNominee}
          />
        )}

        {activeTab === 'Grievance' && (
          <GrievanceTab
            tickets={tickets}
            loading={ticketsLoading}
            error={ticketsError}
            showForm={showGrievanceForm}
            form={grievanceForm}
            onFormChange={setGrievanceForm}
            onSubmit={handleGrievanceSubmit}
            onToggleForm={() => setShowGrievanceForm(!showGrievanceForm)}
          />
        )}
      </ScrollView>

      {/* Save Success Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changes Saved</Text>
            <Text style={styles.modalSubtitle}>Your consent preferences have been updated.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSaveModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Consent Detail Modal */}
      {modalData && (
        <Modal visible={!!modalData} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalData.title}</Text>
                <TouchableOpacity onPress={() => setModalData(null)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={styles.modalSubtitle}>{modalData.description}</Text>
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>Expiry:</Text>
                  <Text style={styles.modalFieldValue}>{modalData.expiry}</Text>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>Collection Point:</Text>
                  <Text style={styles.modalFieldValue}>{modalData.collectionPoint}</Text>
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>Type:</Text>
                  <Text style={[styles.badge, modalData.type === 'Mandatory' && styles.badgeMandatory]}>
                    {modalData.type}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// Tab Components (to be implemented in next steps)
function ConsentTab({ consentGroups, consentsLoading, dirty, onToggle, onSave, onInfoClick }: any) {
  if (consentsLoading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading consents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Manage your Consents here!</Text>
        {dirty && (
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>

      {consentGroups.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>You currently have no consent records to display.</Text>
        </View>
      ) : (
        consentGroups.map((cp: ConsentGroup) => (
          <View key={cp.collection_point} style={styles.consentCard}>
            <Text style={styles.consentCardTitle}>{cp.title}</Text>
            {(cp.purposes || []).map((p) => (
              <View key={p.id} style={styles.purposeCard}>
                <View style={styles.purposeHeader}>
                  <Text style={styles.purposeTitle}>{p.name}</Text>
                  <View style={styles.purposeHeaderRight}>
                    <TouchableOpacity onPress={() => onInfoClick({
                      title: p.name,
                      description: p.description,
                      expiry: p.expiry_period,
                      collectionPoint: cp.title,
                      type: p.is_mandatory ? 'Mandatory' : 'Optional',
                    })}>
                      <Text style={styles.infoIcon}>ℹ️</Text>
                    </TouchableOpacity>
                    <Text style={[styles.badge, p.is_mandatory && styles.badgeMandatory]}>
                      {p.is_mandatory ? 'MANDATORY' : 'OPTIONAL'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.purposeDescription}>{p.description}</Text>
                <View style={styles.purposeDetails}>
                  <Text style={styles.detailText}>Expiry: {p.expiry_period}</Text>
                  <Text style={styles.detailText}>Collection Point: {cp.title}</Text>
                </View>
                <View style={styles.purposeStatus}>
                  <Text style={styles.statusText}>
                    Shown to Principal: {cp.shown_to_principal ? 'Yes' : 'No'}
                  </Text>
                  <Text style={styles.statusText}>
                    Consented: {p.consented === 'accepted' ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.toggleContainer}>
                  <Switch
                    value={p.consented === 'accepted'}
                    onValueChange={() => onToggle(p.id, cp.collection_point)}
                  />
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

function RightsTab({ showDeleteModal, deleteConfirmed, onDeleteRequest, onCloseModal, onOpenModal }: any) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Your Data Rights</Text>
      <Text style={styles.sectionSubtitle}>You can access, correct, delete, or export your data.</Text>
      <TouchableOpacity style={styles.dangerButton} onPress={onOpenModal}>
        <Text style={styles.dangerButtonText}>Request Data Deletion</Text>
      </TouchableOpacity>

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!deleteConfirmed ? (
              <>
                <Text style={styles.modalTitle}>Confirm Data Deletion</Text>
                <Text style={styles.modalSubtitle}>
                  Are you sure you want to request data deletion? This action cannot be undone.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.dangerButton} onPress={onDeleteRequest}>
                    <Text style={styles.dangerButtonText}>Confirm Deletion</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={onCloseModal}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Request Submitted</Text>
                <Text style={styles.modalSubtitle}>
                  Your data deletion request has been submitted successfully!
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TransparencyTab() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Transparency</Text>
      <Text style={styles.sectionSubtitle}>Learn how we collect, use, and protect your data</Text>
      <Text style={styles.transparencyText}>
        We collect your data to provide better services and comply with regulations. Your data is stored securely and used only for the purposes you've consented to.
      </Text>
    </View>
  );
}

function DPOTab({ dpoInfo, loading, error }: any) {
  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading DPO information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Data Protection Officer (DPO) Contact</Text>
      <Text style={styles.sectionSubtitle}>Contact our DPO for data protection matters and privacy concerns</Text>
      {dpoInfo && (
        <View style={styles.dpoCard}>
          <View style={styles.dpoItem}>
            <Text style={styles.dpoLabel}>Name</Text>
            <Text style={styles.dpoValue}>{dpoInfo.full_name || 'N/A'}</Text>
          </View>
          <View style={styles.dpoItem}>
            <Text style={styles.dpoLabel}>Email</Text>
            <Text style={styles.dpoValue}>{dpoInfo.email || 'N/A'}</Text>
          </View>
          <View style={styles.dpoItem}>
            <Text style={styles.dpoLabel}>Appointment Date</Text>
            <Text style={styles.dpoValue}>{dpoInfo.appointment_date || 'N/A'}</Text>
          </View>
          <View style={styles.dpoItem}>
            <Text style={styles.dpoLabel}>Qualifications</Text>
            <Text style={styles.dpoValue}>{dpoInfo.qualifications || 'N/A'}</Text>
          </View>
          <View style={styles.dpoItem}>
            <Text style={styles.dpoLabel}>Responsibilities</Text>
            <Text style={styles.dpoValue}>{dpoInfo.responsibilities || 'N/A'}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function NomineeTab({ nominee, editing, nomineeForm, loading, error, onFormChange, onSubmit, onEdit, onCancel, onDelete }: any) {
  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading nominee information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Appoint Nominee</Text>
      <Text style={styles.sectionSubtitle}>Appoint someone to manage your data rights on your behalf</Text>
      
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ Your nominee will be able to exercise all data rights on your behalf.
        </Text>
      </View>

      {nominee && !editing ? (
        <View style={styles.nomineeCard}>
          <View style={styles.nomineeItem}>
            <Text style={styles.nomineeLabel}>Name</Text>
            <Text style={styles.nomineeValue}>{nominee.nominee_name}</Text>
          </View>
          <View style={styles.nomineeItem}>
            <Text style={styles.nomineeLabel}>Relationship</Text>
            <Text style={styles.nomineeValue}>{nominee.relationship}</Text>
          </View>
          <View style={styles.nomineeItem}>
            <Text style={styles.nomineeLabel}>Email</Text>
            <Text style={styles.nomineeValue}>{nominee.nominee_email}</Text>
          </View>
          <View style={styles.nomineeItem}>
            <Text style={styles.nomineeLabel}>Mobile</Text>
            <Text style={styles.nomineeValue}>{nominee.nominee_mobile}</Text>
          </View>
          {nominee.purpose_of_appointment && (
            <View style={styles.nomineeItem}>
              <Text style={styles.nomineeLabel}>Purpose of Appointment</Text>
              <Text style={styles.nomineeValue}>{nominee.purpose_of_appointment}</Text>
            </View>
          )}
          <View style={styles.nomineeActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={onEdit}>
              <Text style={styles.primaryButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} onPress={onDelete}>
              <Text style={styles.dangerButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full name of nominee *"
            value={nomineeForm.nominee_name}
            onChangeText={(text) => onFormChange({ ...nomineeForm, nominee_name: text })}
          />
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>Relationship *</Text>
            {/* Simplified - in real app use Picker or similar */}
            <TextInput
              style={styles.input}
              placeholder="Select relationship"
              value={nomineeForm.relationship}
              onChangeText={(text) => onFormChange({ ...nomineeForm, relationship: text })}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email *"
            keyboardType="email-address"
            value={nomineeForm.nominee_email}
            onChangeText={(text) => onFormChange({ ...nomineeForm, nominee_email: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number *"
            keyboardType="phone-pad"
            value={nomineeForm.nominee_mobile}
            onChangeText={(text) => onFormChange({ ...nomineeForm, nominee_mobile: text })}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Purpose of Appointment"
            multiline
            numberOfLines={4}
            value={nomineeForm.purpose_of_appointment}
            onChangeText={(text) => onFormChange({ ...nomineeForm, purpose_of_appointment: text })}
          />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
              <Text style={styles.primaryButtonText}>
                {editing ? 'Update Nominee' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>
            {editing && (
              <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function GrievanceTab({ tickets, loading, error, showForm, form, onFormChange, onSubmit, onToggleForm }: any) {
  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading grievance tickets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Grievance Tickets</Text>
          <Text style={styles.sectionSubtitle}>Submit privacy concerns or view your existing tickets</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={onToggleForm}>
          <Text style={styles.primaryButtonText}>Create New Ticket</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Subject *"
            value={form.subject}
            onChangeText={(text) => onFormChange({ ...form, subject: text })}
          />
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>Category *</Text>
            <TextInput
              style={styles.input}
              placeholder="Select category"
              value={form.category}
              onChangeText={(text) => onFormChange({ ...form, category: text })}
            />
          </View>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Description *"
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(text) => onFormChange({ ...form, description: text })}
          />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
              <Text style={styles.primaryButtonText}>Submit Ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onToggleForm}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.ticketsSection}>
        <Text style={styles.ticketsTitle}>Your Tickets</Text>
        {tickets.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>No tickets found. Create your first grievance ticket above.</Text>
          </View>
        ) : (
          tickets.map((ticket: GrievanceTicket, index: number) => (
            <View key={index} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <Text style={styles.ticketStatus}>{ticket.status || 'Open'}</Text>
              </View>
              <Text style={styles.ticketDescription}>{ticket.description}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  principalBanner: {
    backgroundColor: '#e0e7ff',
    padding: 12,
    alignItems: 'center',
  },
  principalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 2,
  },
  tabActive: {
    borderBottomColor: '#9333ea',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#9333ea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  tabContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  consentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  consentCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  purposeCard: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  purposeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  purposeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  purposeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeMandatory: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  purposeDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  purposeDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  purposeStatus: {
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  toggleContainer: {
    alignItems: 'flex-start',
  },
  saveButton: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  dangerButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'center',
  },
  transparencyText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  dpoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  dpoItem: {
    marginBottom: 16,
  },
  dpoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  dpoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
  },
  nomineeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  nomineeItem: {
    marginBottom: 16,
  },
  nomineeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  nomineeValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  nomineeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  form: {
    marginTop: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    color: '#1e293b',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectContainer: {
    marginBottom: 12,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  formActions: {
    marginTop: 16,
  },
  ticketsSection: {
    marginTop: 24,
  },
  ticketsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  ticketStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  modalClose: {
    fontSize: 24,
    color: '#64748b',
  },
  modalField: {
    marginBottom: 12,
  },
  modalFieldLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  modalFieldValue: {
    fontSize: 14,
    color: '#1e293b',
  },
  modalButton: {
    backgroundColor: '#9333ea',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalActions: {
    marginTop: 16,
  },
});

