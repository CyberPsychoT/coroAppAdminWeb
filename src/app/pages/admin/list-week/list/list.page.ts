import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FirestoreService } from 'src/app/services/firestore.service';
import { List } from 'src/app/interfaces/list';
import { Song } from 'src/app/interfaces/song';

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
})
export class ListPage implements OnInit {
  list: List | undefined;
  songs: Song[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const listId = params['id'];
      if (listId) {
        this.firestoreService.getListById(listId).subscribe((list) => {
          this.list = list;
          if (list.songIds) {
            this.songs = [];
            list.songIds.forEach((songId) => {
              this.firestoreService.getSongById(songId).subscribe((song) => {
                if (song) {
                  this.songs.push(song);
                }
              });
            });
          }
        });
      }
    });
  }
}
