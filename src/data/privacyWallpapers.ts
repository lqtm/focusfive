import type { PrivacyWallpaperId } from '../domain/models';

export interface PrivacyWallpaperOption {
  id: PrivacyWallpaperId;
  label: string;
  imagePath: string;
  position: string;
  photographer?: string;
  sourceUrl: string;
}

export const PRIVACY_WALLPAPERS: PrivacyWallpaperOption[] = [
  {
    id: 'misty-lake',
    label: 'Misty lake',
    imagePath: '/privacy-wallpaper.webp',
    position: 'center',
    photographer: 'Simona D’Auria',
    sourceUrl: 'https://unsplash.com/photos/a-foggy-lake-surrounded-by-tall-grass-and-trees-dDKjrFzijbM',
  },
  {
    id: 'lonely-road',
    label: 'Lonely road',
    imagePath: '/privacy-lonely-road.webp',
    position: 'center',
    photographer: 'Alin Gavriliuc',
    sourceUrl: 'https://unsplash.com/photos/a-lonely-road-stretches-toward-misty-mountains-TiB8OG58OPc',
  },
  {
    id: 'wanderlust',
    label: 'Wanderlust',
    imagePath: '/privacy-wanderlust.webp',
    position: 'center',
    photographer: 'Paul Pastourmatzis',
    sourceUrl: 'https://unsplash.com/photos/landscape-photography-of-mountains-qKIaA41lMjM',
  },
  {
    id: 'forest-bend',
    label: 'Forest bend',
    imagePath: '/privacy-forest-bend.webp',
    position: 'center',
    sourceUrl: 'https://images.unsplash.com/photo-1476067897447-d0c5df27b5df',
  },
  {
    id: 'sunset-road',
    label: 'Sunset road',
    imagePath: '/privacy-sunset-road.webp',
    position: 'center 65%',
    sourceUrl: 'https://images.unsplash.com/photo-1549742324-b463bc9dd374',
  },
  {
    id: 'open-country',
    label: 'Open country',
    imagePath: '/privacy-open-country.webp',
    position: 'center 70%',
    sourceUrl: 'https://images.unsplash.com/photo-1561602535-c6b696936c62',
  },
];
