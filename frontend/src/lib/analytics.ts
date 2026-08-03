/**
 * Telemetry removed for ULab Scribe.
 *
 * Upstream Meetily shipped a PostHog client (host: https://us.i.posthog.com)
 * that reported first-launch, daily-active-user, session lifecycle, meeting
 * metadata, model choices and device class to a third-party endpoint owned by
 * the upstream vendor. That has been removed in full: the Rust `analytics`
 * module, the `posthog-rs` dependency, and all 25 Tauri command registrations
 * are gone from the binary.
 *
 * This file is a typed no-op shim. It preserves the original public surface so
 * every call site keeps compiling and behaves as though analytics were
 * permanently disabled. Nothing here touches the network, the filesystem, the
 * Tauri store, or any Tauri command.
 *
 * The local-only helpers (getPersistentUserId, getMeetingsCountToday,
 * updateMeetingCount, calculateDaysSince, hasUsedFeatureBefore, markFeatureUsed)
 * previously wrote to a Tauri store file named `analytics.json`. They never
 * left the machine, but they existed solely to enrich outbound events, so they
 * are neutralised here too. No caller displays their values in the UI.
 *
 * Do not reintroduce a live implementation without an explicit privacy review.
 */

export interface AnalyticsProperties {
  [key: string]: string;
}

export interface DeviceInfo {
  platform: string;
  os_version: string;
  architecture: string;
}

export interface UserSession {
  session_id: string;
  user_id: string;
  start_time: string;
  last_heartbeat: string;
  is_active: boolean;
}

const NOOP_DEVICE_INFO: DeviceInfo = {
  platform: 'unknown',
  os_version: 'unknown',
  architecture: 'unknown',
};

/**
 * Disabled analytics facade. Every method resolves to a neutral value.
 */
export class Analytics {
  // ---- lifecycle -----------------------------------------------------------
  static async init(): Promise<void> {}
  static async disable(): Promise<void> {}
  static async isEnabled(): Promise<boolean> { return false; }
  static async cleanup(): Promise<void> {}
  static reset(): void {}
  static async waitForInitialization(_timeout: number = 5000): Promise<boolean> { return false; }

  // ---- core emitters -------------------------------------------------------
  static async track(_eventName: string, _properties?: AnalyticsProperties): Promise<void> {}
  static async identify(_userId: string, _properties?: AnalyticsProperties): Promise<void> {}

  // ---- sessions ------------------------------------------------------------
  static async startSession(_userId: string): Promise<string | null> { return null; }
  static async endSession(): Promise<void> {}
  static async isSessionActive(): Promise<boolean> { return false; }
  static async trackSessionStarted(_sessionId: string): Promise<void> {}
  static async trackSessionEnded(_sessionId: string): Promise<void> {}

  // ---- identity ------------------------------------------------------------
  static async getPersistentUserId(): Promise<string> { return 'anonymous'; }
  static getCurrentUserId(): string | null { return null; }

  // ---- environment ---------------------------------------------------------
  static async getPlatform(): Promise<string> { return 'unknown'; }
  static async getOSVersion(): Promise<string> { return 'unknown'; }
  static async getDeviceInfo(): Promise<DeviceInfo> { return { ...NOOP_DEVICE_INFO }; }

  // ---- usage counters (previously local Tauri store) -----------------------
  static async trackDailyActiveUser(): Promise<void> {}
  static async trackUserFirstLaunch(): Promise<void> {}
  static async checkAndTrackFirstLaunch(): Promise<void> {}
  static async checkAndTrackDailyUsage(): Promise<void> {}
  static async calculateDaysSince(_dateKey: string): Promise<number | null> { return null; }
  static async updateMeetingCount(): Promise<void> {}
  static async getMeetingsCountToday(): Promise<number> { return 0; }
  static async hasUsedFeatureBefore(_featureName: string): Promise<boolean> { return false; }
  static async markFeatureUsed(_featureName: string): Promise<void> {}

  // ---- meetings and recordings --------------------------------------------
  static async trackMeetingStarted(_meetingId: string): Promise<void> {}
  static async trackMeetingDeleted(_meetingId: string): Promise<void> {}
  static async trackRecordingStarted(_meetingId: string): Promise<void> {}
  static async trackRecordingStopped(_meetingId: string, _durationSeconds?: number): Promise<void> {}
  static async trackMeetingCompleted(
    _meetingId: string,
    _metrics: {
      duration_seconds: number;
      transcript_segments: number;
      transcript_word_count: number;
      words_per_minute: number;
      meetings_today: number;
    },
  ): Promise<void> {}

  // ---- features and UI -----------------------------------------------------
  static async trackFeatureUsed(_featureName: string): Promise<void> {}
  static async trackFeatureUsedEnhanced(_featureName: string, _properties?: Record<string, any>): Promise<void> {}
  static async trackCopy(_copyType: 'transcript' | 'summary', _properties?: Record<string, any>): Promise<void> {}
  static async trackSettingsChanged(_settingType: string, _newValue: string): Promise<void> {}
  static async trackPageView(_pageName: string): Promise<void> {}
  static async trackButtonClick(_buttonName: string, _location?: string): Promise<void> {}
  static async trackAppStarted(): Promise<void> {}

  // ---- errors and backend --------------------------------------------------
  static async trackError(_errorType: string, _errorMessage: string): Promise<void> {}
  static async trackBackendConnection(_success: boolean, _error?: string): Promise<void> {}
  static async trackTranscriptionError(_errorMessage: string): Promise<void> {}
  static async trackTranscriptionSuccess(_duration?: number): Promise<void> {}

  // ---- summarization -------------------------------------------------------
  static async trackSummaryGenerationStarted(
    _modelProvider: string,
    _modelName: string,
    _transcriptLength: number,
    _timeSinceRecordingMinutes?: number,
  ): Promise<void> {}
  static async trackSummaryGenerationCompleted(
    _modelProvider: string,
    _modelName: string,
    _success: boolean,
    _durationSeconds?: number,
    _errorMessage?: string,
  ): Promise<void> {}
  static async trackSummaryRegenerated(_modelProvider: string, _modelName: string): Promise<void> {}
  static async trackModelChanged(
    _oldProvider: string,
    _oldModel: string,
    _newProvider: string,
    _newModel: string,
  ): Promise<void> {}
  static async trackCustomPromptUsed(_promptLength: number): Promise<void> {}
}

export default Analytics;
