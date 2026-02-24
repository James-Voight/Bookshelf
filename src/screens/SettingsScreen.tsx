import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBooks, useGoals, useSettings } from '../hooks/useBooks';
import { useAuth } from '../context/AuthContext';
import { createUserStorage } from '../storage/bookStorage';
import { SUBSCRIPTION_PLANS } from '../types/subscription';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { user, signOut, updateSubscription } = useAuth();
  const { books, refreshBooks } = useBooks();
  const { getCurrentYearGoal, saveGoal } = useGoals();
  const { settings, updateSettings } = useSettings();
  
  const [goalTarget, setGoalTarget] = useState(getCurrentYearGoal()?.targetBooks || 12);

  const currentYear = new Date().getFullYear();
  const currentGoal = getCurrentYearGoal();
  const completedThisYear = books.filter(b => {
    if (!b.dateCompleted) return false;
    return new Date(b.dateCompleted).getFullYear() === currentYear;
  }).length;

  const subscription = user?.subscription;
  const currentPlan = subscription ? SUBSCRIPTION_PLANS[subscription.tier] : SUBSCRIPTION_PLANS.free;
  const isOwner = user?.isOwner || false;

  const handleUpdateGoal = (increment: number) => {
    const newTarget = Math.max(1, Math.min(200, goalTarget + increment));
    setGoalTarget(newTarget);
    saveGoal({
      id: `goal_${currentYear}`,
      year: currentYear,
      targetBooks: newTarget,
      createdAt: currentGoal?.createdAt || new Date().toISOString(),
    });
  };

  // Get user-specific storage
  const userStorage = createUserStorage(user?.uid || null);

  const handleExport = async () => {
    try {
      const data = await userStorage.exportData();
      await Share.share({
        message: data,
        title: 'BookShelf Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data?',
      'This will delete all your books and reading data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await userStorage.clearAll();
            refreshBooks();
            Alert.alert('Done', 'All data has been cleared');
          },
        },
      ]
    );
  };

  const handleCancelSubscription = () => {
    if (!subscription || subscription.tier === 'free') return;

    const confirm = () => {
      const title = 'Cancel Subscription';
      const message = `Your ${currentPlan.name} subscription will remain active until the end of the current billing period. After that, you'll be downgraded to the Free plan.`;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
        if (!window.confirm(message)) return;
        return Promise.resolve(true);
      }
      return new Promise(resolve => {
        Alert.alert(
          'Cancel Subscription?',
          message,
          [
            { text: 'Keep Subscription', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Cancel Subscription', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });
    };

    const notify = (title: string, message: string) => {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(`${title}\n\n${message}`);
        return;
      }
      Alert.alert(title, message);
    };

    confirm().then(async ok => {
      if (!ok) return;
      try {
        await updateSubscription({
          cancelAtPeriodEnd: true,
        });
        notify('Subscription Cancelled', 'Your subscription will end at the current billing period.');
      } catch (error) {
        notify('Error', 'Failed to cancel subscription');
      }
    });
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      signOut();
      return;
    }
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const goalProgress = currentGoal ? completedThisYear / currentGoal.targetBooks : 0;

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.textDark]}>Settings</Text>
      </View>

      {/* Account Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Account</Text>
        
        {user ? (
          <>
            <View style={styles.accountInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={[styles.accountName, isDark && styles.textDark]}>
                  {user.displayName || 'User'}
                </Text>
                <Text style={styles.accountEmail}>{user.email}</Text>
                {isOwner && (
                  <View style={styles.ownerBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.ownerBadgeText}>Owner</Text>
                  </View>
                )}
              </View>
            </View>
            
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Subscription Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Subscription</Text>
        
        <TouchableOpacity 
          style={styles.subscriptionCard}
          onPress={() => navigation.navigate('Subscription')}
        >
          <View style={styles.subscriptionInfo}>
            <View style={[
              styles.planBadge, 
              subscription?.tier === 'bookworm' && styles.planBadgeBookworm,
              subscription?.tier === 'reader' && styles.planBadgeReader,
            ]}>
              <Text style={styles.planBadgeText}>{currentPlan.name}</Text>
            </View>
            <Text style={[styles.subscriptionPrice, isDark && styles.textDark]}>
              {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/month`}
            </Text>
            {isOwner && (
              <Text style={styles.ownerNote}>Owner - Premium Free</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Book Limit Info */}
        {currentPlan.bookLimit !== null && (
          <View style={styles.limitInfo}>
            <Ionicons name="information-circle-outline" size={18} color="#888" />
            <Text style={styles.limitText}>
              {books.length} / {currentPlan.bookLimit} books used
            </Text>
          </View>
        )}

        {/* Cancel Subscription */}
        {subscription && subscription.tier !== 'free' && !isOwner && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
          >
            <Text style={styles.cancelButtonText}>
              {subscription.cancelAtPeriodEnd 
                ? 'Subscription ending soon' 
                : 'Cancel Subscription'}
            </Text>
          </TouchableOpacity>
        )}

        {subscription?.cancelAtPeriodEnd && (
          <Text style={styles.cancelNote}>
            Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Reading Goal Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Reading Goal</Text>
        
        <View style={styles.goalCard}>
          <View style={styles.goalStats}>
            <Text style={[styles.goalProgress, isDark && styles.textDark]}>
              {completedThisYear} / {goalTarget}
            </Text>
            <Text style={styles.goalLabel}>{currentYear} Goal</Text>
          </View>
          
          <View style={styles.goalCircle}>
            <View style={[styles.goalCircleInner, goalProgress >= 1 && styles.goalComplete]}>
              <Text style={styles.goalPercent}>{Math.round(goalProgress * 100)}%</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.goalAdjust}>
          <Text style={styles.goalAdjustLabel}>Books per year:</Text>
          <View style={styles.stepper}>
            <TouchableOpacity 
              style={styles.stepperButton} 
              onPress={() => handleUpdateGoal(-1)}
            >
              <Ionicons name="remove" size={20} color="#007AFF" />
            </TouchableOpacity>
            <Text style={[styles.stepperValue, isDark && styles.textDark]}>{goalTarget}</Text>
            <TouchableOpacity 
              style={styles.stepperButton} 
              onPress={() => handleUpdateGoal(1)}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Notifications</Text>
        
        <SettingRow icon="calendar-outline" label="Library Due Dates" isDark={isDark}>
          <Switch
            value={settings.libraryDueReminders}
            onValueChange={v => updateSettings({ libraryDueReminders: v })}
          />
        </SettingRow>
        
        <SettingRow icon="book-outline" label="Series Releases" isDark={isDark}>
          <Switch
            value={settings.seriesReleaseReminders}
            onValueChange={v => updateSettings({ seriesReleaseReminders: v })}
          />
        </SettingRow>
        
        <SettingRow icon="notifications-outline" label="Reading Reminders" isDark={isDark}>
          <Switch
            value={settings.readingReminders}
            onValueChange={v => updateSettings({ readingReminders: v })}
          />
        </SettingRow>
      </View>

      {/* Data Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Data</Text>
        
        <TouchableOpacity style={styles.dataRow} onPress={handleExport}>
          <Ionicons name="share-outline" size={22} color="#007AFF" />
          <Text style={[styles.dataRowText, isDark && styles.textDark]}>Export Library</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dataRow} onPress={handleClearData}>
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          <Text style={styles.dataRowTextDanger}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={[styles.section, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.textDark]}>About</Text>
        
        <View style={styles.dataRow}>
          <Text style={[styles.aboutLabel, isDark && styles.textDark]}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={[styles.aboutLabel, isDark && styles.textDark]}>Books in Library</Text>
          <Text style={styles.aboutValue}>{books.length}</Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function SettingRow({ icon, label, isDark, children }: any) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingRowLeft}>
        <Ionicons name={icon} size={22} color="#888" />
        <Text style={[styles.settingLabel, isDark && styles.textDark]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionDark: {
    backgroundColor: '#1c1c1e',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  // Account styles
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  accountEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ownerBadgeText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
  },
  signInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Subscription styles
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subscriptionInfo: {
    gap: 4,
  },
  planBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  planBadgeReader: {
    backgroundColor: '#007AFF',
  },
  planBadgeBookworm: {
    backgroundColor: '#AF52DE',
  },
  planBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },
  ownerNote: {
    fontSize: 12,
    color: '#F57C00',
  },
  limitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  limitText: {
    fontSize: 14,
    color: '#888',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    paddingBottom: 8,
  },
  // Goal styles
  goalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalStats: {
    flex: 1,
  },
  goalProgress: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  goalLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  goalCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalComplete: {
    backgroundColor: '#34C759',
  },
  goalPercent: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  goalAdjust: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  goalAdjustLabel: {
    fontSize: 14,
    color: '#888',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
    color: '#000',
  },
  // Other styles
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataRowText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  dataRowTextDanger: {
    flex: 1,
    fontSize: 16,
    color: '#FF3B30',
  },
  aboutLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  aboutValue: {
    fontSize: 16,
    color: '#888',
  },
  textDark: {
    color: '#fff',
  },
});
