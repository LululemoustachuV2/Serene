import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudy, hardwareChip, leaf, radio, volumeMute, water } from 'ionicons/icons';
import { AmbientSound } from '../../services/audio.service';

@Component({
  selector: 'app-sound-picker',
  template: `
    @if (compact) {
      <div class="sound-row">
        @for (s of sounds; track s.id) {
          <button
            type="button"
            class="sound-icon"
            [class.active]="s.id === active"
            [attr.title]="s.label"
            [attr.aria-label]="s.label"
            (click)="select.emit(s.id)"
          >
            <ion-icon [name]="s.icon" aria-hidden="true" />
          </button>
        }
      </div>
    } @else {
      <div class="sound-grid">
        @for (s of sounds; track s.id) {
          <button
            type="button"
            class="sound-chip"
            [class.active]="s.id === active"
            (click)="select.emit(s.id)"
          >
            <ion-icon [name]="s.icon" />
            <span>{{ s.label }}</span>
          </button>
        }
      </div>
    }
  `,
  standalone: true,
  imports: [IonIcon],
  styleUrl: './sound-picker.component.scss',
})
export class SoundPickerComponent {
  @Input() active: AmbientSound = 'silence';
  @Input() compact = false;
  @Output() select = new EventEmitter<AmbientSound>();

  sounds = [
    { id: 'silence', label: 'Silence', icon: 'volume-mute' },
    { id: 'brown-noise', label: 'Bruit brun', icon: 'hardware-chip' },
    { id: 'white-noise', label: 'Bruit blanc', icon: 'radio' },
    { id: 'rain', label: 'Pluie', icon: 'cloudy' },
    { id: 'ocean', label: 'Océan', icon: 'water' },
    { id: 'wind', label: 'Vent', icon: 'leaf' },
  ] as Array<{ id: AmbientSound; label: string; icon: string }>;

  constructor() {
    addIcons({ volumeMute, hardwareChip, radio, cloudy, water, leaf });
  }
}
