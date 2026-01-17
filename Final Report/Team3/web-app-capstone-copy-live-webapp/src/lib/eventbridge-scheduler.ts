// AWS EventBridge Scheduler integration for medication reminders
// This would typically use AWS SDK in a real implementation

export interface MedicationReminderSchedule {
  medicationId: string;
  clientId: string;
  medicationName: string;
  scheduledTimes: string[]; // Array of times like ["08:00", "20:00"]
  timezone?: string;
}

export interface ScheduledReminder {
  id: string;
  medicationId: string;
  scheduleName: string;
  nextExecution: string;
  isActive: boolean;
}

// Mock implementation - in production this would use AWS EventBridge Scheduler
class EventBridgeScheduler {
  private schedules: Map<string, ScheduledReminder> = new Map();

  async createMedicationSchedule(schedule: MedicationReminderSchedule): Promise<ScheduledReminder[]> {
    const reminders: ScheduledReminder[] = [];

    for (const time of schedule.scheduledTimes) {
      const scheduleName = `medication-${schedule.medicationId}-${time.replace(':', '')}`;
      const reminderId = `${schedule.medicationId}-${time}`;

      // Calculate next execution time
      const nextExecution = this.calculateNextExecution(time, schedule.timezone);

      const reminder: ScheduledReminder = {
        id: reminderId,
        medicationId: schedule.medicationId,
        scheduleName,
        nextExecution: nextExecution.toISOString(),
        isActive: true,
      };

      // In production, this would create an EventBridge schedule
      await this.createEventBridgeSchedule(scheduleName, time, {
        medicationId: schedule.medicationId,
        clientId: schedule.clientId,
        medicationName: schedule.medicationName,
      });

      this.schedules.set(reminderId, reminder);
      reminders.push(reminder);
    }

    return reminders;
  }

  async updateMedicationSchedule(
    medicationId: string, 
    schedule: MedicationReminderSchedule
  ): Promise<ScheduledReminder[]> {
    // Delete existing schedules
    await this.deleteMedicationSchedule(medicationId);
    
    // Create new schedules
    return this.createMedicationSchedule(schedule);
  }

  async deleteMedicationSchedule(medicationId: string): Promise<void> {
    const schedulesToDelete = Array.from(this.schedules.values())
      .filter(schedule => schedule.medicationId === medicationId);

    for (const schedule of schedulesToDelete) {
      // In production, this would delete the EventBridge schedule
      await this.deleteEventBridgeSchedule(schedule.scheduleName);
      this.schedules.delete(schedule.id);
    }
  }

  async pauseMedicationSchedule(medicationId: string): Promise<void> {
    const schedules = Array.from(this.schedules.values())
      .filter(schedule => schedule.medicationId === medicationId);

    for (const schedule of schedules) {
      // In production, this would disable the EventBridge schedule
      await this.disableEventBridgeSchedule(schedule.scheduleName);
      schedule.isActive = false;
    }
  }

  async resumeMedicationSchedule(medicationId: string): Promise<void> {
    const schedules = Array.from(this.schedules.values())
      .filter(schedule => schedule.medicationId === medicationId);

    for (const schedule of schedules) {
      // In production, this would enable the EventBridge schedule
      await this.enableEventBridgeSchedule(schedule.scheduleName);
      schedule.isActive = true;
    }
  }

  async getMedicationSchedules(medicationId: string): Promise<ScheduledReminder[]> {
    return Array.from(this.schedules.values())
      .filter(schedule => schedule.medicationId === medicationId);
  }

  private calculateNextExecution(time: string, timezone = 'UTC'): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const nextExecution = new Date();
    
    nextExecution.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (nextExecution <= now) {
      nextExecution.setDate(nextExecution.getDate() + 1);
    }
    
    return nextExecution;
  }

  private async createEventBridgeSchedule(
    scheduleName: string, 
    time: string, 
    payload: any
  ): Promise<void> {
    // Mock implementation
    // In production, this would use AWS SDK to create EventBridge schedule
    // Mock implementation - in production, this would create the actual EventBridge schedule
    
    // Example AWS SDK call:
    /*
    const eventBridge = new EventBridgeSchedulerClient({ region: 'us-east-1' });
    
    await eventBridge.send(new CreateScheduleCommand({
      Name: scheduleName,
      ScheduleExpression: `cron(${minutes} ${hours} * * ? *)`,
      Target: {
        Arn: process.env.MEDICATION_REMINDER_LAMBDA_ARN,
        RoleArn: process.env.EVENTBRIDGE_ROLE_ARN,
        Input: JSON.stringify(payload),
      },
      FlexibleTimeWindow: {
        Mode: 'OFF'
      },
      State: 'ENABLED'
    }));
    */
  }

  private async deleteEventBridgeSchedule(scheduleName: string): Promise<void> {
    // Mock implementation
    // Mock implementation - in production, this would delete the actual EventBridge schedule
    
    // Example AWS SDK call:
    /*
    const eventBridge = new EventBridgeSchedulerClient({ region: 'us-east-1' });
    
    await eventBridge.send(new DeleteScheduleCommand({
      Name: scheduleName
    }));
    */
  }

  private async disableEventBridgeSchedule(scheduleName: string): Promise<void> {
    // Mock implementation
    // Mock implementation - in production, this would disable the actual EventBridge schedule
    
    // Example AWS SDK call:
    /*
    const eventBridge = new EventBridgeSchedulerClient({ region: 'us-east-1' });
    
    await eventBridge.send(new UpdateScheduleCommand({
      Name: scheduleName,
      State: 'DISABLED'
    }));
    */
  }

  private async enableEventBridgeSchedule(scheduleName: string): Promise<void> {
    // Mock implementation
    // Mock implementation - in production, this would enable the actual EventBridge schedule
    
    // Example AWS SDK call:
    /*
    const eventBridge = new EventBridgeSchedulerClient({ region: 'us-east-1' });
    
    await eventBridge.send(new UpdateScheduleCommand({
      Name: scheduleName,
      State: 'ENABLED'
    }));
    */
  }
}

// Export singleton instance
export const eventBridgeScheduler = new EventBridgeScheduler();

// Hook to integrate with medication management
export function useMedicationScheduler() {
  const createSchedule = async (schedule: MedicationReminderSchedule) => {
    try {
      return await eventBridgeScheduler.createMedicationSchedule(schedule);
    } catch (error) {
      console.error('Error creating medication schedule:', error);
      throw error;
    }
  };

  const updateSchedule = async (medicationId: string, schedule: MedicationReminderSchedule) => {
    try {
      return await eventBridgeScheduler.updateMedicationSchedule(medicationId, schedule);
    } catch (error) {
      console.error('Error updating medication schedule:', error);
      throw error;
    }
  };

  const deleteSchedule = async (medicationId: string) => {
    try {
      await eventBridgeScheduler.deleteMedicationSchedule(medicationId);
    } catch (error) {
      console.error('Error deleting medication schedule:', error);
      throw error;
    }
  };

  const pauseSchedule = async (medicationId: string) => {
    try {
      await eventBridgeScheduler.pauseMedicationSchedule(medicationId);
    } catch (error) {
      console.error('Error pausing medication schedule:', error);
      throw error;
    }
  };

  const resumeSchedule = async (medicationId: string) => {
    try {
      await eventBridgeScheduler.resumeMedicationSchedule(medicationId);
    } catch (error) {
      console.error('Error resuming medication schedule:', error);
      throw error;
    }
  };

  const getSchedules = async (medicationId: string) => {
    try {
      return await eventBridgeScheduler.getMedicationSchedules(medicationId);
    } catch (error) {
      console.error('Error getting medication schedules:', error);
      throw error;
    }
  };

  return {
    createSchedule,
    updateSchedule,
    deleteSchedule,
    pauseSchedule,
    resumeSchedule,
    getSchedules,
  };
}