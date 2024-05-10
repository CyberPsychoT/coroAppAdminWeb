import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Song } from 'src/app/interfaces/song';

@Component({
  selector: 'app-song',
  templateUrl: './song.page.html',
  styleUrls: ['./song.page.scss'],
})
export class SongPage implements OnInit {
  song: Song | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const songId = params['id'];
      this.loadSong(songId);
    });
  }

  loadSong(songId: string) {
    this.firestoreService.getSongById(songId).subscribe((song) => {
      this.song = song;
    });
  }
}
