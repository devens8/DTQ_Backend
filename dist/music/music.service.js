"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicService = void 0;
const common_1 = require("@nestjs/common");
const BOLLYWOOD_CATALOG = [
    { trackId: 'bj-001', source: 'local', title: 'Balam Pichkari', artist: 'Vishal Shekhar, Shalmali Kholgade', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 265000, explicit: false, previewUrl: null },
    { trackId: 'bj-002', source: 'local', title: 'Gallan Goodiyaan', artist: 'Shilpa Rao, Nakash Aziz, Shadab Faridi', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 290000, explicit: false, previewUrl: null },
    { trackId: 'bj-003', source: 'local', title: 'Nagada Sang Dhol', artist: 'Shreya Ghoshal, Osman Mir', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 274000, explicit: false, previewUrl: null },
    { trackId: 'bj-004', source: 'local', title: 'Lungi Dance', artist: 'Yo Yo Honey Singh, Deepika Padukone', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 237000, explicit: false, previewUrl: null },
    { trackId: 'bj-005', source: 'local', title: 'Desi Beat', artist: 'Yo Yo Honey Singh', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 248000, explicit: false, previewUrl: null },
    { trackId: 'bj-006', source: 'local', title: 'Badtameez Dil', artist: 'Benny Dayal, Shefali Alvares', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 255000, explicit: false, previewUrl: null },
    { trackId: 'bj-007', source: 'local', title: 'Tattad Tattad', artist: 'Arijit Singh, Mika Singh', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 262000, explicit: false, previewUrl: null },
    { trackId: 'bj-008', source: 'local', title: 'Ghagra', artist: 'Rekha Bhardwaj, Vishal Dadlani', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 270000, explicit: false, previewUrl: null },
    { trackId: 'bj-009', source: 'local', title: 'Party All Night', artist: 'Honey Singh, Yo Yo Honey Singh', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 243000, explicit: false, previewUrl: null },
    { trackId: 'bj-010', source: 'local', title: 'Ainvayi Ainvayi', artist: 'Salim Merchant, Sunidhi Chauhan', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 258000, explicit: false, previewUrl: null },
    { trackId: 'bj-011', source: 'local', title: 'London Thumakda', artist: 'Labh Janjua, Sonu Kakkar', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 235000, explicit: false, previewUrl: null },
    { trackId: 'bj-012', source: 'local', title: 'Seeti Maar', artist: 'Dev Negi, Arpita Mewada', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 228000, explicit: false, previewUrl: null },
    { trackId: 'bj-013', source: 'local', title: 'Dilbar', artist: 'Neha Kakkar, Dhvani Bhanushali', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 233000, explicit: false, previewUrl: null },
    { trackId: 'bj-014', source: 'local', title: 'Wakhra Swag', artist: 'Badshah, Navv Inder', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 219000, explicit: false, previewUrl: null },
    { trackId: 'bj-015', source: 'local', title: 'Kamariya', artist: 'Darshan Raval, Nikhita Gandhi', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 224000, explicit: false, previewUrl: null },
    { trackId: 'bj-016', source: 'local', title: 'Kala Chashma', artist: 'Amar Arshi, Badshah, Neha Kakkar', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 231000, explicit: false, previewUrl: null },
    { trackId: 'bj-017', source: 'local', title: 'Kar Gayi Chull', artist: 'Fazilpuria, Badshah, Sukriti Kakar', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 218000, explicit: false, previewUrl: null },
    { trackId: 'bj-018', source: 'local', title: 'Tamma Tamma Again', artist: 'Bappi Lahiri, Anuradha Paudwal', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 245000, explicit: false, previewUrl: null },
    { trackId: 'bj-019', source: 'local', title: 'Saturday Saturday', artist: 'Indeep Bakshi, Harshdeep Kaur', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 227000, explicit: false, previewUrl: null },
    { trackId: 'bj-020', source: 'local', title: 'Chittiyaan Kalaiyaan', artist: 'Meet Bros Anjjan, Kanika Kapoor', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 236000, explicit: false, previewUrl: null },
    { trackId: 'bj-021', source: 'local', title: 'Gal Ban Gayi', artist: 'Udit Narayan, Neha Kakkar, Yash Narvekar', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 222000, explicit: false, previewUrl: null },
    { trackId: 'bj-022', source: 'local', title: 'Buzz', artist: 'Badshah, Aastha Gill', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 214000, explicit: false, previewUrl: null },
    { trackId: 'bj-023', source: 'local', title: 'Paani Wala Dance', artist: 'Ikka, Aastha Gill', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 220000, explicit: false, previewUrl: null },
    { trackId: 'bj-024', source: 'local', title: 'Garmi', artist: 'Badshah, Neha Kakkar', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 209000, explicit: false, previewUrl: null },
    { trackId: 'bj-025', source: 'local', title: 'Illegal Weapon', artist: 'Garry Sandhu, Jasmine Sandlas', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 216000, explicit: false, previewUrl: null },
    { trackId: 'bj-026', source: 'local', title: 'Dance Meri Rani', artist: 'Guru Randhawa, Nora Fatehi', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 211000, explicit: false, previewUrl: null },
    { trackId: 'bj-027', source: 'local', title: 'Naach Meri Rani', artist: 'Guru Randhawa, Nikhita Gandhi', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 208000, explicit: false, previewUrl: null },
    { trackId: 'bj-028', source: 'local', title: 'Kusu Kusu', artist: 'Neha Kakkar, Dev Negi', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 205000, explicit: false, previewUrl: null },
    { trackId: 'bj-029', source: 'local', title: 'Jhoomle', artist: 'Badshah, Aastha Gill', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 207000, explicit: false, previewUrl: null },
    { trackId: 'bj-030', source: 'local', title: 'Hauli Hauli', artist: 'Neha Kakkar, Garry Sandhu', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 213000, explicit: false, previewUrl: null },
    { trackId: 'bj-031', source: 'local', title: 'Morni Banke', artist: 'Neha Kakkar, Gurnam Bhullar', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 219000, explicit: false, previewUrl: null },
    { trackId: 'bj-032', source: 'local', title: 'Dil Dooba', artist: 'Sunidhi Chauhan, K.K.', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 287000, explicit: false, previewUrl: null },
    { trackId: 'bj-033', source: 'local', title: 'Sheila Ki Jawani', artist: 'Sunidhi Chauhan, Vishal Dadlani', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 244000, explicit: false, previewUrl: null },
    { trackId: 'bj-034', source: 'local', title: 'Munni Badnaam Hui', artist: 'Mamta Sharma, Aishwarya Majmudar', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 239000, explicit: false, previewUrl: null },
    { trackId: 'bj-035', source: 'local', title: 'Jalebi Baby', artist: 'Tesher, Jason Derulo', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 176000, explicit: false, previewUrl: null },
    { trackId: 'bj-036', source: 'local', title: 'Chhod Denge', artist: 'Sachet Tandon, Parampara Tandon', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 204000, explicit: false, previewUrl: null },
    { trackId: 'bj-037', source: 'local', title: 'Burjkhalifa', artist: 'Lijo George, DJ Chetas, Nikhita Gandhi', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 198000, explicit: false, previewUrl: null },
    { trackId: 'bj-038', source: 'local', title: 'Genda Phool', artist: 'Badshah, Payal Dev', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 195000, explicit: false, previewUrl: null },
    { trackId: 'bj-039', source: 'local', title: 'Bijlee Bijlee', artist: 'Harrdy Sandhu', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 201000, explicit: false, previewUrl: null },
    { trackId: 'bj-040', source: 'local', title: 'Saami Saami', artist: 'Mounika Yadav, Sid Sriram', albumArtUrl: 'https://i.imgur.com/7Bx3KjQ.png', durationMs: 212000, explicit: false, previewUrl: null },
];
let MusicService = class MusicService {
    searchTracks(query, limit = 10) {
        if (!query || query.trim().length === 0) {
            return BOLLYWOOD_CATALOG.slice(0, limit);
        }
        const q = query.toLowerCase();
        const results = BOLLYWOOD_CATALOG.filter(t => t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q));
        return (results.length > 0 ? results : BOLLYWOOD_CATALOG).slice(0, limit);
    }
    getTrack(trackId) {
        return BOLLYWOOD_CATALOG.find(t => t.trackId === trackId) || null;
    }
};
exports.MusicService = MusicService;
exports.MusicService = MusicService = __decorate([
    (0, common_1.Injectable)()
], MusicService);
//# sourceMappingURL=music.service.js.map