import { Component, EventEmitter, Output, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category';
import { ICategory, IGame } from '../../interfaces/game.interface';
import { DashboardService, ICreateGameDto, IUploadMediaResponse } from '../../services/dashboard';
import { ToastService } from '../../services/toast';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type CreateStep = 'info' | 'media' | 'build';

@Component({
  selector: 'app-create-game-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-game-modal.html'
})
export class CreateGameModalComponent implements OnInit {
  private catService = inject(CategoryService);
  private dashService = inject(DashboardService);
  private toast = inject(ToastService);

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  title = signal('');
  description = signal('');
  price = signal(0);
  categoryIds = signal<number[]>([]);
  isLoading = signal(false);

  currentStep = signal<CreateStep>('info');
  categories = signal<ICategory[]>([]);
  createdGameId = signal<string | null>(null);
  coverFile = signal<File | null>(null);
  gameFile = signal<File | null>(null);
  screenshotFiles = signal<File[]>([]);

  uploadedCover = signal<string | null>(null);
  uploadedScreenshots = signal<string[]>([]);

  coverPreview = signal<string | null>(null);
  screenshotsPreview = signal<string[]>([]);


  isStep1Valid = computed(() => {
    const t = this.title().trim();
    const d = this.description().trim();
    return t.length >= 2 && t.length <= 80 && 
          d.length >= 10 && d.length <= 2000 && 
          this.categoryIds().length > 0 &&
          this.price() >= 0;
  });

  isStep2Valid = computed(() => {
    return this.coverFile() !== null && 
           this.screenshotFiles().length >= 1 && 
           this.screenshotFiles().length <= 6;
  });

  nextStep() {
    if (this.currentStep() === 'info' && this.isStep1Valid()) {
      if (!this.createdGameId()) {
        this.submitInfo();
      } else {
        this.currentStep.set('media');
      }
    } else if (this.currentStep() === 'media' && this.isStep2Valid()) {
      this.currentStep.set('build');
    }
  }

  prevStep() {
    if (this.currentStep() === 'media') this.currentStep.set('info');
    if (this.currentStep() === 'build') this.currentStep.set('media');
  }

  gameData = {
    title: '',
    description: '',
    price: 0,
    categoryIds: [] as number[]
  };

  ngOnInit() {
    this.catService.getCategories().subscribe(res => this.categories.set(res));
  }

  submitInfo(): void {
    if (this.isStep1Valid()) {
      this.currentStep.set('media');
    }
  }

  toggleCategory(id: number) {
    const current = this.categoryIds();
    if (current.includes(id)) {
      this.categoryIds.set(current.filter(catId => catId !== id));
    } else {
      this.categoryIds.set([...current, id]);
    }
  }

  async onFileSelected(event: Event, isMain: boolean) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    const TARGET_RATIO = 16 / 9;
    const TOLERANCE = 0.02;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    const fileList = Array.from(files);

    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.toast.show(`Invalid format: "${file.name}". Use JPG, PNG or WEBP.`, 'error');
        continue;
      }

      if (file.size > MAX_SIZE) {
        this.toast.show(`"${file.name}" is too heavy. Max 10MB.`, 'error');
        continue;
      }

      try {
        const dimensions = await this.getImageDimensions(file);
        const currentRatio = dimensions.width / dimensions.height;

        if (Math.abs(currentRatio - TARGET_RATIO) > TOLERANCE) {
          this.toast.show(
            `Aspect Ratio error: "${file.name}" is not 16:9. Please crop your image.`, 
            'error'
          );
          continue;
        }

        if (dimensions.width < 640) {
          this.toast.show(`"${file.name}" resolution is too low. Min width: 640px.`, 'error');
          continue;
        }

      } catch (err) {
        this.toast.show(`Could not read "${file.name}".`, 'error');
        continue;
      }

      if (isMain) {
        this.coverFile.set(file);
        this.coverPreview.set(URL.createObjectURL(file));
        this.toast.show('Cover image accepted!', 'success');
      } else {
        if (this.screenshotFiles().length < 6) {
          this.screenshotFiles.update(prev => [...prev, file]);
          this.screenshotsPreview.update(prev => [...prev, URL.createObjectURL(file)]);
        } else {
          this.toast.show('Maximum 6 screenshots allowed.', 'error');
          break;
        }
      }
    }
    
    target.value = '';
  }

  preventNegative(event: KeyboardEvent) {
    if (event.key === '-' || event.key === 'e') {
      event.preventDefault();
    }
  }

  removeScreenshot(index: number) {
    this.screenshotFiles.update(prev => prev.filter((_, i) => i !== index));
    this.screenshotsPreview.update(prev => prev.filter((_, i) => i !== index));
  }

  async publishGame() {
    if (!this.isStep2Valid() || !this.gameFile()) {
      this.toast.show('Please complete all requirements', 'error');
      return;
    }

    this.isLoading.set(true);

    const payload = {
      title: this.title(),
      description: this.description(),
      price: this.price(),
      categoryIds: this.categoryIds(),
      status: 'active'
    };

    try {
      const newGame = await firstValueFrom(this.dashService.createGame(payload));
      const gameId = newGame.id;

      console.log(`[1/3] Game record created: ${gameId}`);

      await this.uploadAllMedia(gameId);
      console.log(`[2/3] Media assets linked`);

      const buildData = new FormData();
      buildData.append('gameId', gameId);
      buildData.append('gameTitle', this.title());
      buildData.append('file', this.gameFile()!);
      
      await firstValueFrom(this.dashService.uploadBuild(buildData));
      console.log(`[3/3] Build archive deployed`);

      this.toast.show('Game published successfully!', 'success');
      this.created.emit();
      this.close.emit();

    } catch (err: any) {
      console.error('Deployment Failed:', err);
      this.toast.show(err.error?.message || 'Deployment failed. Check connection.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  onBuildFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      if (file.name.endsWith('.zip')) {
        this.gameFile.set(file);
        this.toast.show('Build archive accepted!', 'success');
      } else {
        this.toast.show('Please upload a .zip file only', 'error');
      }
    }
  }

  private async uploadAllMedia(gameId: string) {
    const uploadImg = async (file: File, isMain: boolean) => {
      const data = new FormData();
      data.append('gameId', gameId);
      data.append('gameTitle', this.title());
      data.append('isMain', String(isMain));
      data.append('file', file);
      return await firstValueFrom(this.dashService.uploadMedia(data));
    };

    await uploadImg(this.coverFile()!, true);

    for (const file of this.screenshotFiles()) {
      await uploadImg(file, false);
    }
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const dimensions = { width: img.width, height: img.height };
        URL.revokeObjectURL(img.src);
        resolve(dimensions);
      };
      img.onerror = () => reject('Invalid image file');
      img.src = URL.createObjectURL(file);
    });
  }

  async finish() {
    if (!this.isStep2Valid()) {
      this.toast.show('Please upload a cover and at least one screenshot', 'error');
      return;
    }

    this.isLoading.set(true);
    try {
      const gameId = this.createdGameId();
      if (!gameId) throw new Error('No Game ID found');

      await this.uploadAllMedia(gameId);

      this.toast.show('Game published successfully!', 'success');
      this.created.emit();
      this.close.emit();
    } catch (err) {
      this.toast.show('Upload failed. Please check file sizes.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}