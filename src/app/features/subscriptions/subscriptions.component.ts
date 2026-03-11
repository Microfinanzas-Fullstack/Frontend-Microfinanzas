import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';

import { SubscriptionService } from '../../core/services/subscription.service';
import { SubscriptionDTO, SubscriptionStatus } from '../../core/models';
import { SubscriptionFormComponent } from './subscription-form/subscription-form.component';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule,
    MatMenuModule,
  ],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css'
})
export class SubscriptionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  SubscriptionStatus = SubscriptionStatus;

  allSubscriptions = signal<SubscriptionDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  activeSubscriptions = computed(() =>
    this.allSubscriptions().filter(s => s.status === SubscriptionStatus.ACTIVE)
  );

  pausedSubscriptions = computed(() =>
    this.allSubscriptions().filter(s => s.status === SubscriptionStatus.PAUSED)
  );

  cancelledSubscriptions = computed(() =>
    this.allSubscriptions().filter(s => s.status === SubscriptionStatus.CANCELLED)
  );

  monthlyCost = computed(() => {
    const summary = this.subscriptionService.calculateSubscriptionSummary(this.allSubscriptions());
    return summary.totalMonthlyAmount;
  });

  mainCurrency = computed(() => {
    const subs = this.allSubscriptions();
    return subs.length > 0 ? subs[0].currency : 'USD';
  });

  constructor(
    private subscriptionService: SubscriptionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.subscriptionService.subscriptions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(subs => this.allSubscriptions.set(subs));

    this.loadSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubscriptions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.subscriptionService.getAllSubscriptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.loading.set(false);
          this.error.set('Error al cargar suscripciones. Intenta de nuevo.');
        }
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SubscriptionFormComponent, {
      width: '520px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Suscripción creada exitosamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  pauseSubscription(sub: SubscriptionDTO): void {
    this.subscriptionService.pauseSubscription(sub.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.snackBar.open(`"${sub.name}" pausada`, 'Cerrar', { duration: 3000 }),
        error: () => this.snackBar.open('Error al pausar suscripción', 'Cerrar', { duration: 3000 })
      });
  }

  cancelSubscription(sub: SubscriptionDTO): void {
    if (!confirm(`¿Cancelar "${sub.name}"? Esta acción no se puede deshacer.`)) return;

    this.subscriptionService.cancelSubscription(sub.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.snackBar.open(`"${sub.name}" cancelada`, 'Cerrar', { duration: 3000 }),
        error: () => this.snackBar.open('Error al cancelar suscripción', 'Cerrar', { duration: 3000 })
      });
  }

  reactivateSubscription(sub: SubscriptionDTO): void {
    this.subscriptionService.reactivateSubscription(sub.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.snackBar.open(`"${sub.name}" reactivada`, 'Cerrar', { duration: 3000 }),
        error: () => this.snackBar.open('Error al reactivar suscripción', 'Cerrar', { duration: 3000 })
      });
  }

  confirmDelete(sub: SubscriptionDTO): void {
    if (!confirm(`¿Eliminar "${sub.name}"? Esta acción no se puede deshacer.`)) return;

    this.subscriptionService.deleteSubscription(sub.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.snackBar.open(`"${sub.name}" eliminada`, 'Cerrar', { duration: 3000 }),
        error: () => this.snackBar.open('Error al eliminar suscripción', 'Cerrar', { duration: 3000 })
      });
  }

  formatCurrency(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  getBillingCycleLabel(days: number): string {
    const labels: Record<number, string> = {
      7: 'Semanal', 15: 'Quincenal', 30: 'Mensual',
      90: 'Trimestral', 180: 'Semestral', 365: 'Anual',
    };
    return labels[days] ?? `Cada ${days} días`;
  }
}
