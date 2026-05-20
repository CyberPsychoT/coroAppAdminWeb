import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FormGroup, FormControl } from '@angular/forms';
import { Song } from 'src/app/interfaces/song';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-song',
  templateUrl: './song.page.html',
  styleUrls: ['./song.page.scss'],
})
export class SongPage implements OnInit {
  songForm: FormGroup;
  isEditing: boolean = false;
  private originalSongData: Song | null = null;

  // Array para generar las secciones dinámicamente en el HTML
  songSections = [
    { key: 'introduction', title: 'Introducción', open: true },
    { key: 'letter1', title: 'Letra y Acordes (Parte 1)', open: true },
    { key: 'interlude', title: 'Interludio', open: true },
    { key: 'letter2', title: 'Letra y Acordes (Parte 2)', open: true },
    { key: 'end', title: 'Final', open: true },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private firestoreService: FirestoreService,
    private location: Location,
    private sanitizer: DomSanitizer
  ) {
    this.songForm = new FormGroup({
      id: new FormControl(''),
      name: new FormControl(''),
      introduction: new FormControl(''),
      letter1: new FormControl(''),
      interlude: new FormControl(''),
      letter2: new FormControl(''),
      end: new FormControl(''),
      label: new FormControl(''),
    });
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const songId = params['id'];
      if (songId) {
        this.loadSong(songId);
      }
    });
  }

  loadSong(songId: string) {
    this.firestoreService.getSongById(songId).subscribe((song) => {
      if (song) {
        this.originalSongData = song; // Guardar el estado original
        this.songForm.patchValue(song);
      }
    });
  }

  startEditing() {
    this.isEditing = true;
  }

  cancelEditing() {
    if (this.originalSongData) {
      this.songForm.patchValue(this.originalSongData); // Restaurar datos originales
    }
    this.isEditing = false;
  }

  async updateSong() {
    if (this.songForm.invalid) {
      console.error('El formulario no es válido');
      return;
    }
    const updatedData: Partial<Song> = this.songForm.value;

    try {
      await this.firestoreService.updateSong(updatedData.id as string, updatedData);
      
      await Swal.fire({
        title: '¡Actualizado!',
        text: 'La canción se ha actualizado correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: 'var(--ion-color-primary)',
        heightAuto: false
      });

      this.originalSongData = { ...this.songForm.value };
      this.isEditing = false;
    } catch (error) {
      console.error('Error al actualizar la canción:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al actualizar la canción.',
        icon: 'error',
        confirmButtonText: 'Intentar de nuevo',
        heightAuto: false
      });
    }
  }

  toggleSection(section: any) {
    section.open = !section.open;
  }

  trackByKey(index: number, section: any): string {
    return section.key;
  }
  
  goBack() {
    this.location.back();
  }

  parseChords(text: string): SafeHtml {
    if (!text) return '';
    
    // Si el texto no contiene corchetes, se asume que es formato antiguo.
    // Retornamos el texto con un div que preserva el formato de espacios (pre-wrap).
    if (!text.includes('[')) {
       return this.sanitizer.bypassSecurityTrustHtml(`<div style="white-space: pre-wrap; font-family: Consolas, 'Roboto Mono', monospace;">${text}</div>`);
    }

    const lines = text.split('\n');
    let htmlOutput = '';

    lines.forEach(line => {
      if (line.trim() === '') {
        htmlOutput += '<br>';
        return;
      }

      let parsedLine = line.replace(/\[(.*?)\]([^\[]*)/g, (match, chord, lyric) => {
        return `<span class="chord-wrapper"><span class="chord">${chord}</span><span class="lyric">${lyric.replace(/ /g, '&nbsp;')}</span></span>`;
      });

      if (!line.startsWith('[')) {
        const firstPart = line.split('[')[0];
        parsedLine = `<span class="lyric">${firstPart.replace(/ /g, '&nbsp;')}</span>` + parsedLine.substring(firstPart.length);
      }

      htmlOutput += `<div class="lyric-line">${parsedLine}</div>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(htmlOutput);
  }
}
