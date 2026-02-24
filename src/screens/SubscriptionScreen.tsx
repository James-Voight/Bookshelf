import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { 
  SUBSCRIPTION_PLANS, 
  SubscriptionTier, 
  SubscriptionPlan 
} from '../types/subscription';
import { createCheckoutSession, createPortalSession } from '../config/stripe';

export function SubscriptionScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, updateSubscription } = useAuth();

  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);

  const currentTier = user?.subscription.tier || 'free';
  const isOwner = user?.isOwner || false;

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: title, style: 'destructive', onPress: onConfirm },
    ]);
  };

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return;
    if (tier === 'free') {
      confirmAction(
        'Downgrade to Free',
        'Are you sure you want to downgrade? You will lose access to premium features.',
        () => handleDowngrade()
      );
      return;
    }

    setSelectedPlan(tier);
    setLoading(true);

    try {
      // In production, this would create a Stripe checkout session
      // For demo, we'll simulate the upgrade
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo: directly update subscription
      await updateSubscription({
        tier,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      
      notify('Success!', `You are now subscribed to ${SUBSCRIPTION_PLANS[tier].name}!`);
      navigation.goBack();
      
      /* Production code:
      const plan = SUBSCRIPTION_PLANS[tier];
      const checkoutUrl = await createCheckoutSession(
        plan.priceId,
        user?.subscription.stripeCustomerId || '',
        user?.email || ''
      );
      await Linking.openURL(checkoutUrl);
      */
    } catch (error: any) {
      notify('Error', error.message || 'Failed to process subscription');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      await updateSubscription({
        tier: 'free',
        status: 'active',
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: undefined,
      });
      notify('Done', 'Your subscription has been cancelled.');
    } catch (error) {
      notify('Error', 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    // In production, open Stripe Customer Portal
    notify(
      'Manage Subscription',
      'This would open the Stripe Customer Portal where you can update payment methods, view invoices, or cancel.'
    );
    
    /* Production code:
    const portalUrl = await createPortalSession(user?.subscription.stripeCustomerId || '');
    await Linking.openURL(portalUrl);
    */
  };

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.textDark]}>Choose Your Plan</Text>
      </View>

      {isOwner && (
        <View style={styles.ownerBadge}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.ownerBadgeText}>
            Owner Account - All premium features unlocked!
          </Text>
        </View>
      )}

      <View style={styles.plansContainer}>
        {(Object.values(SUBSCRIPTION_PLANS) as SubscriptionPlan[]).map((plan) => {
          const isCurrentPlan = plan.id === currentTier;
          const isPopular = plan.id === 'reader';
          
          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isDark && styles.planCardDark,
                isCurrentPlan && styles.planCardCurrent,
                isPopular && styles.planCardPopular,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
              disabled={loading || isOwner}
            >
              {isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}
              
              {isCurrentPlan && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current Plan</Text>
                </View>
              )}

              <Text style={[styles.planName, isDark && styles.textDark]}>
                {plan.name}
              </Text>
              
              <View style={styles.priceContainer}>
                <Text style={[styles.price, isDark && styles.textDark]}>
                  ${plan.price.toFixed(2)}
                </Text>
                {plan.price > 0 && (
                  <Text style={styles.priceUnit}>/month</Text>
                )}
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={18} 
                      color={plan.id === 'free' ? '#888' : '#34C759'} 
                    />
                    <Text style={[styles.featureText, isDark && styles.textMuted]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {loading && selectedPlan === plan.id ? (
                <View style={styles.loadingButton}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View style={[
                  styles.selectButton,
                  isCurrentPlan && styles.selectButtonCurrent,
                  plan.id === 'free' && currentTier !== 'free' && styles.selectButtonDowngrade,
                ]}>
                  <Text style={[
                    styles.selectButtonText,
                    isCurrentPlan && styles.selectButtonTextCurrent,
                  ]}>
                    {isCurrentPlan ? 'Current Plan' : 
                     plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {currentTier !== 'free' && !isOwner && (
        <TouchableOpacity 
          style={styles.manageButton}
          onPress={handleManageSubscription}
        >
          <Ionicons name="settings-outline" size={20} color="#007AFF" />
          <Text style={styles.manageButtonText}>Manage Subscription</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          • Cancel anytime from Settings{'\n'}
          • Secure payment via Stripe{'\n'}
          • 7-day money-back guarantee
        </Text>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  ownerBadgeText: {
    color: '#F57C00',
    fontWeight: '600',
    flex: 1,
  },
  plansContainer: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardDark: {
    backgroundColor: '#1c1c1e',
  },
  planCardCurrent: {
    borderColor: '#007AFF',
  },
  planCardPopular: {
    borderColor: '#34C759',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  priceUnit: {
    fontSize: 16,
    color: '#888',
    marginLeft: 4,
  },
  featuresContainer: {
    marginTop: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  selectButtonCurrent: {
    backgroundColor: '#e0e0e0',
  },
  selectButtonDowngrade: {
    backgroundColor: '#FF3B30',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonTextCurrent: {
    color: '#888',
  },
  loadingButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    gap: 8,
  },
  manageButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  textDark: {
    color: '#fff',
  },
  textMuted: {
    color: '#aaa',
  },
});
