import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const NARUTO_CHARACTERS = {
  '/': { src: '/anime/naruto/naruto.jpeg', alt: 'Naruto character artwork' },
  '/search': { src: '/anime/naruto/sasuke.jpeg', alt: 'Sasuke character artwork' },
  '/explore': { src: '/anime/naruto/obito.jpeg', alt: 'Obito character artwork' },
  '/study-tracker': { src: '/anime/naruto/boruto.jpeg', alt: 'Boruto character artwork' }
};

export default function AnimeCharacterLayer() {
  const { theme } = useAppContext();
  const { pathname } = useLocation();

  if (theme !== 'shinobi-night') return null;

  const character = NARUTO_CHARACTERS[pathname] || NARUTO_CHARACTERS['/'];

  return (
    <div className="anime-character-layer" aria-hidden="true">
      <img src={character.src} alt="" className="anime-character-art" />
      <div className="anime-character-fade" />
    </div>
  );
}
