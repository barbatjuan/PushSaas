/**
 * OneSignal Automation Service
 * Automatically creates and configures OneSignal apps for new sites
 */

interface OneSignalAppConfig {
  name: string;
  url: string;
  icon_url?: string;
}

interface OneSignalApp {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  players: number;
  messageable_players: number;
  basic_auth_key: string;
  chrome_web_origin?: string;
  site_name?: string;
  [key: string]: any; // Allow additional properties
}

interface WebPushPlatformConfig {
  site_name: string;
  subdomain?: string;
  default_notification_url: string;
  default_title: string;
  default_icon: string;
  chrome_web_origin: string;
  chrome_web_default_notification_icon: string;
  chrome_web_sub_domain: string;
}

export class OneSignalAutomation {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://onesignal.com/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create a new OneSignal app automatically
   */
  async createApp(config: OneSignalAppConfig): Promise<OneSignalApp> {
    try {
      const response = await fetch(`${this.baseUrl}/apps`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          apns_env: 'production', // iOS environment
          gcm_key: '', // Will be configured later if needed
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create OneSignal app: ${error}`);
      }

      const app = await response.json();
      console.log('✅ OneSignal app created:', app.id);
      
      return app;
    } catch (error) {
      console.error('❌ Failed to create OneSignal app:', error);
      throw error;
    }
  }

  /**
   * Configure Web Push platform for the app
   */
  async configureWebPush(appId: string, config: OneSignalAppConfig): Promise<void> {
    try {
      const webPushConfig: WebPushPlatformConfig = {
        site_name: config.name,
        default_notification_url: config.url,
        default_title: config.name,
        default_icon: config.icon_url || `${config.url}/favicon.ico`,
        chrome_web_origin: config.url,
        chrome_web_default_notification_icon: config.icon_url || `${config.url}/favicon.ico`,
        chrome_web_sub_domain: this.extractSubdomain(config.url),
      };

      const response = await fetch(`${this.baseUrl}/apps/${appId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webPushConfig),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to configure Web Push: ${error}`);
      }

      console.log('✅ Web Push platform configured for app:', appId);
    } catch (error) {
      console.error('❌ Failed to configure Web Push:', error);
      throw error;
    }
  }

  /**
   * Get app details to verify configuration
   */
  async getApp(appId: string): Promise<OneSignalApp> {
    try {
      const response = await fetch(`${this.baseUrl}/apps/${appId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get app details: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get app details:', error);
      throw error;
    }
  }

  /**
   * Validate that the app is properly configured for Web Push
   */
  async validateWebPushSetup(appId: string): Promise<boolean> {
    try {
      const app = await this.getApp(appId);
      
      // Check if Web Push is properly configured
      const hasWebPush = app.chrome_web_origin && app.site_name;
      
      if (hasWebPush) {
        console.log('✅ Web Push validation passed for app:', appId);
        return true;
      } else {
        console.log('❌ Web Push validation failed for app:', appId);
        return false;
      }
    } catch (error) {
      console.error('❌ Web Push validation error:', error);
      return false;
    }
  }

  /**
   * Complete automation: Create app + Configure Web Push + Validate
   */
  async createAndConfigureApp(config: OneSignalAppConfig): Promise<{
    app: OneSignalApp;
    isValid: boolean;
  }> {
    try {
      console.log('🚀 Starting OneSignal automation for:', config.name);
      
      // Step 1: Create the app
      const app = await this.createApp(config);
      
      // Step 2: Configure Web Push
      await this.configureWebPush(app.id, config);
      
      // Step 3: Wait a moment for configuration to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Validate the setup
      const isValid = await this.validateWebPushSetup(app.id);
      
      console.log('🎉 OneSignal automation completed:', {
        appId: app.id,
        isValid,
      });
      
      return { app, isValid };
    } catch (error) {
      console.error('💥 OneSignal automation failed:', error);
      throw error;
    }
  }

  /**
   * Extract subdomain from URL for OneSignal configuration
   */
  private extractSubdomain(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const parts = hostname.split('.');
      
      // If it's a subdomain (more than 2 parts), return the first part
      if (parts.length > 2) {
        return parts[0];
      }
      
      // Otherwise, use the domain name without TLD
      return parts[0];
    } catch (error) {
      console.error('Failed to extract subdomain:', error);
      return 'pushsaas';
    }
  }
}

// Export singleton instance
export const oneSignalAutomation = new OneSignalAutomation(
  process.env.ONESIGNAL_USER_AUTH_KEY || ''
);
