import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameAvatar } from './game-avatar';
import { getPlayerVisualThemeByColor } from '../../lib/player-color-themes';
import type { TokenSkinId } from '../../lib/token-cosmetics';
import { useAppSettingsStore } from '../../store/app-settings-store';

type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';
type PodiumPlace = 1 | 2 | 3 | 4;

interface RankingEntry {
  avatar: string;
  id: string;
  name: string;
  place: PodiumPlace;
  reward: number;
  color: PlayerColor;
  title?: string;
  visualSkinId?: TokenSkinId;
}

type FallingCoinConfig = {
  animationDelay: string;
  animationDuration: string;
  left: string;
  transform: string;
}

const defaultRanking = [
  { id: "P1", name: "P1", place: 1, reward: 1000, color: "red", avatar: 'P1' },
  { id: "P2", name: "P2", place: 2, reward: 500, color: "green", avatar: 'P2' },
  { id: "P4", name: "P4", place: 3, reward: 250, color: "blue", avatar: 'P4' },
  { id: "P3", name: "P3", place: 4, reward: 100, color: "yellow", avatar: 'P3' }
] as const satisfies RankingEntry[];

const avatarToneByColor: Record<PlayerColor, string> = {
  blue: 'from-[#d6edff] via-[#8fd4ff] to-[#3e93df]',
  green: 'from-[#dcffe6] via-[#9ef0b4] to-[#4caf6b]',
  red: 'from-[#ffd9d9] via-[#ff9f95] to-[#d85d4f]',
  yellow: 'from-[#fff6d6] via-[#ffe48a] to-[#d2ae3e]',
};

const placePodiumHeightClassNew: Record<PodiumPlace, string> = {
  1: 'h-[320px]',
  2: 'h-[240px]',
  3: 'h-[180px]',
  4: 'h-[130px]',
};

const placeMedalColors: Record<PodiumPlace, { bg: string, border: string }> = {
  1: { bg: 'from-[#FFDF73] via-[#F4B41A] to-[#D48900]', border: '#FFEA99' },
  2: { bg: 'from-[#E2E8F0] via-[#A0AEC0] to-[#718096]', border: '#F7FAFC' },
  3: { bg: 'from-[#F6AD55] via-[#DD6B20] to-[#9C4221]', border: '#FBD38D' },
  4: { bg: 'from-[#D69E2E] via-[#B7791F] to-[#975A16]', border: '#F6E05E' },
};

const placeRibbonClassNew: Record<PodiumPlace, string> = {
  1: 'bg-[#E74C3C] border-[#C0392B]',
  2: 'bg-[#2ECC71] border-[#27AE60]',
  3: 'bg-[#3498DB] border-[#2980B9]',
  4: 'bg-[#F1C40F] border-[#D68910]',
};

const rankingCopyByLanguage = {
  es: {
    coins: 'MONEDAS',
    finalRanking: 'CLASIFICACIÓN FINAL',
    placeOrdinalLabel: {
      1: '1º',
      2: '2º',
      3: '3º',
      4: '4º',
    } as Record<PodiumPlace, string>,
    placeTitleByPlace: {
      1: 'GANADOR',
      2: '2° LUGAR',
      3: '3° LUGAR',
      4: '4° LUGAR',
    } as Record<PodiumPlace, string>,
    scoreDetails: 'VER PUNTUACIÓN DETALLADA',
    backHome: 'VOLVER AL MENÚ PRINCIPAL',
  },
  en: {
    coins: 'COINS',
    finalRanking: 'FINAL RANKING',
    placeOrdinalLabel: {
      1: '1ST',
      2: '2ND',
      3: '3RD',
      4: '4TH',
    } as Record<PodiumPlace, string>,
    placeTitleByPlace: {
      1: 'WINNER',
      2: '2ND PLACE',
      3: '3RD PLACE',
      4: '4TH PLACE',
    } as Record<PodiumPlace, string>,
    scoreDetails: 'VIEW DETAILED SCORE',
    backHome: 'BACK TO MAIN MENU',
  },
} as const;

const placeMedalRibbons = (place: PodiumPlace) => {
  const common = "w-[18px] h-[54px] rounded-b-sm border-x-2 border-b-2 shadow-sm origin-top";
  if (place === 1) return (
    <>
      <div className={`${common} -rotate-[30deg] bg-gradient-to-b from-[#EF5350] to-[#C62828] border-[#8E0000]`} />
      <div className={`${common} rotate-[30deg] bg-gradient-to-b from-[#EF5350] to-[#C62828] border-[#8E0000]`} />
    </>
  );
  if (place === 2) return (
    <>
      <div className={`${common} -rotate-[30deg] bg-gradient-to-b from-[#42A5F5] to-[#1565C0] border-[#0D47A1]`} />
      <div className={`${common} rotate-[30deg] bg-gradient-to-b from-[#42A5F5] to-[#1565C0] border-[#0D47A1]`} />
    </>
  );
  if (place === 3) return (
    <>
      <div className={`${common} -rotate-[30deg] bg-gradient-to-b from-[#EF5350] to-[#C62828] border-[#8E0000]`} />
      <div className={`${common} rotate-[30deg] bg-gradient-to-b from-[#42A5F5] to-[#1565C0] border-[#0D47A1]`} />
    </>
  );
  return (
    <>
      <div className={`${common} -rotate-[30deg] bg-gradient-to-b from-[#FFA726] to-[#EF6C00] border-[#E65100]`} />
      <div className={`${common} rotate-[30deg] bg-gradient-to-b from-[#FFA726] to-[#EF6C00] border-[#E65100]`} />
    </>
  );
}

type FinalRankingScreenProps = {
  placements?: RankingEntry[];
}

export default function FinalRankingScreen({ placements }: FinalRankingScreenProps) {
  const [show, setShow] = useState(false);
  const [fallingCoins] = useState<FallingCoinConfig[]>(() =>
    Array.from({ length: 40 }, () => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${1.5 + Math.random() * 2}s`,
      transform: `scale(${0.5 + Math.random() * 0.5})`,
    }))
  );
  const navigate = useNavigate();
  const language = useAppSettingsStore((state) => state.language);
  const ui = rankingCopyByLanguage[language];

  useEffect(() => {
    // Pequeño delay para asegurar que el montaje haya sucedido antes de aplicar las clases de show
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  const ranking = placements && placements.length > 0 ? placements : [...defaultRanking];

  const podiumPlacementByPlace = ranking.reduce((acc, entry) => {
    acc[entry.place] = entry;
    return acc;
  }, {} as Record<PodiumPlace, RankingEntry>);

  return (
    <div className={`fixed inset-0 z-[300] flex flex-col items-center justify-end bg-[#8CD1FF] overflow-hidden transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Sky background with Rainbow and Clouds */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-center translate-y-[10%]">
         <div className="absolute w-[220vh] h-[220vh] rounded-full border-[6vh] border-[#FF8787]/60" />
         <div className="absolute w-[208vh] h-[208vh] rounded-full border-[6vh] border-[#FFD966]/60 mt-[6vh]" />
         <div className="absolute w-[196vh] h-[196vh] rounded-full border-[6vh] border-[#93E396]/60 mt-[12vh]" />
         <div className="absolute w-[184vh] h-[184vh] rounded-full border-[6vh] border-[#81CBFF]/60 mt-[18vh]" />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Clouds */}
        <div className="absolute top-[10%] left-[8%] w-[180px] h-[60px] bg-white rounded-full opacity-90 shadow-sm" />
        <div className="absolute top-[5%] left-[12%] w-[100px] h-[100px] bg-white rounded-full opacity-90" />
        <div className="absolute top-[5%] left-[18%] w-[120px] h-[80px] bg-white rounded-full opacity-90" />
        
        <div className="absolute top-[20%] right-[10%] w-[240px] h-[70px] bg-white rounded-full opacity-90 shadow-sm" />
        <div className="absolute top-[12%] right-[16%] w-[120px] h-[120px] bg-white rounded-full opacity-90" />
        <div className="absolute top-[14%] right-[22%] w-[140px] h-[90px] bg-white rounded-full opacity-90" />

        {/* Decorative elements */}
        <div className="absolute top-[40%] left-[15%] text-5xl opacity-80 text-red-500 drop-shadow-md transform -rotate-12 animate-pulse">❤️</div>
        <div className="absolute top-[20%] left-[30%] text-6xl opacity-80 text-[#3B82F6] drop-shadow-md font-bold">?</div>
        <div className="absolute top-[35%] right-[20%] text-6xl opacity-80 text-[#3B82F6] drop-shadow-md font-bold transform rotate-12">?</div>
        <div className="absolute top-[25%] right-[35%] text-4xl opacity-80 text-red-500 drop-shadow-md transform rotate-[25deg] animate-pulse">❤️</div>
      </div>

      {/* Wooden Banner */}
      <div className={`absolute top-[4%] left-1/2 -translate-x-1/2 z-[250] drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] transition-transform duration-700 ease-out delay-100 ${show ? 'scale-100' : 'scale-0'}`}>
        <div className="absolute -left-6 top-8 h-14 w-20 bg-[#8E4A23] rounded-l-2xl -skew-x-[20deg]" />
        <div className="absolute -left-6 top-[3.5rem] h-8 w-14 bg-[#572B11] rounded-bl-2xl -skew-x-[20deg]" />
        <div className="absolute -right-6 top-8 h-14 w-20 bg-[#8E4A23] rounded-r-2xl skew-x-[20deg]" />
        <div className="absolute -right-6 top-[3.5rem] h-8 w-14 bg-[#572B11] rounded-br-2xl skew-x-[20deg]" />
        
        <div className="relative z-10 rounded-[20px] border-[6px] border-[#6D381B] bg-gradient-to-b from-[#E2A26D] via-[#C98453] to-[#B36F40] px-[50px] py-[12px] shadow-[inset_0_4px_4px_rgba(255,255,255,0.3),0_10px_0_#874B2A]">
          <h1 className="font-display text-[44px] uppercase tracking-wide text-[#FFF8E7] sm:text-[54px]" style={{textShadow: '0 4px 0 #6D381B, 0 6px 12px rgba(0,0,0,0.5)', WebkitTextStroke: '2px #6D381B'}}>
            {ui.finalRanking}
          </h1>
        </div>
      </div>

      {/* Podiums */}
      <div className="relative w-full max-w-[800px] flex items-end justify-center z-[240] pb-[130px] sm:pb-[150px]">
        {[2, 1, 3, 4].map((placeOrder, index) => {
          const placement = podiumPlacementByPlace[placeOrder as PodiumPlace];
          if (!placement) return null;
          const placementTitle = placement.title || ui.placeTitleByPlace[placement.place];

          return (
            <article
              className={`relative flex w-[180px] flex-col items-center transition-all duration-700 ease-out ${placeOrder === 1 ? 'z-20' : 'z-10'} ${show ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}
              key={`podium-${placement.place}`}
              style={{ transitionDelay: `${index * 150 + 200}ms` }}
            >
              <div className="relative flex flex-col items-center justify-end mb-[-25px] z-30">
                 {placeOrder === 1 && (
                   <div className="absolute -top-[70px] text-[80px] drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] animate-bounce z-40">👑</div>
                 )}
                 
                    <div className={`relative rounded-full border-[6px] ${placeRibbonClassNew[placement.place]} shadow-[0_10px_20px_rgba(0,0,0,0.3)] ${placeOrder === 1 ? 'h-[135px] w-[135px]' : 'h-[105px] w-[105px]'}`}>
                    <div className={`flex h-full w-full items-center justify-center rounded-full border-[3px] border-[#FFF8E7] text-4xl font-black text-white/80 bg-gradient-to-b ${getPlayerVisualThemeByColor(placement.color, placement.visualSkinId).avatarToneClass || avatarToneByColor[placement.color]} shadow-inner overflow-hidden`}>
                      <GameAvatar
                        alt={placement.name}
                        avatar={placement.avatar}
                        imageClassName="h-full w-full object-contain p-2"
                        textClassName="text-4xl font-black text-white/80"
                      />
                    </div>
                 </div>
                 
                  <div className={`relative z-30 -mt-3 rounded-[12px] border-[3px] ${placeRibbonClassNew[placement.place]} px-3 py-1.5 text-center text-[13px] font-black uppercase tracking-wider text-white shadow-[0_5px_10px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.4)]`}>
                    {placement.name} - {placementTitle}
                  </div>
              </div>
              
              <div className={`relative w-full rounded-t-[10px] border-x-[5px] border-t-[5px] border-[#8C522B] bg-gradient-to-b from-[#C48455] to-[#A0643B] shadow-[inset_0_8px_0_rgba(255,255,255,0.2)] ${placePodiumHeightClassNew[placement.place]} flex flex-col items-center pt-[20px]`}>
                 <div className="relative z-10 flex flex-col items-center justify-center mt-[-35px]">
                   <div className="absolute -top-[14px] flex w-[32px] justify-between z-[-1]">
                      {placeMedalRibbons(placement.place)}
                   </div>
                   <div
                     className={`flex h-[68px] w-[68px] items-center justify-center rounded-full border-[4px] border-[#8C522B] bg-gradient-to-b ${placeMedalColors[placement.place].bg}`}
                     style={{
                       boxShadow: `0 6px 10px rgba(0,0,0,0.3), inset 0 3px 0 ${placeMedalColors[placement.place].border}`,
                     }}
                   >
                      <span className="font-display text-[32px] text-[#5A3219] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">{ui.placeOrdinalLabel[placement.place]}</span>
                   </div>
                 </div>
                 
                 <div className="mt-auto mb-6 flex flex-col items-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                   <span className="font-display text-[42px] leading-none text-[#FFF5DE]">{placement.reward}</span>
                    <span className="text-[16px] font-black uppercase tracking-wider text-[#FFD7A0]">{ui.coins}</span>
                 </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Falling Coins Animation Layer */}
      {show && (
        <div className="pointer-events-none absolute inset-0 z-[245] overflow-hidden">
          {fallingCoins.map((coin, i) => (
             <div 
                key={`falling-coin-${i}`}
                className="arcade-coin-falling"
                style={coin}
             />
          ))}
        </div>
      )}

      {/* Base Coins Array (Accumulated) */}
      <div className={`absolute bottom-0 left-0 w-full h-[18vh] z-[245] flex items-end overflow-hidden transition-opacity duration-1000 delay-[800ms] ${show ? 'opacity-100' : 'opacity-0'}`}>
         {Array.from({ length: 80 }).map((_, index) => (
           <div
             key={`pile-coin-${index}`}
             className="arcade-coin"
             style={{
               width: `${45 + (index % 4) * 15}px`,
               height: `${45 + (index % 4) * 15}px`,
               left: `${-2 + (index * 1.3) % 104}%`,
               bottom: `${-10 + (index % 5) * 15 + Math.abs(Math.sin(index) * 25)}px`,
               transform: `rotate(${(index * 23) % 360}deg)`,
               zIndex: index % 15
             }}
           />
         ))}
      </div>

      {/* Buttons */}
      <div className={`absolute bottom-[4%] w-full flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 z-[260] px-4 transition-transform duration-700 ease-out delay-[1000ms] ${show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <button
          className="w-full max-w-[340px] rounded-[30px] border-[5px] border-[#1D4ED8] bg-gradient-to-b from-[#60A5FA] via-[#3B82F6] to-[#2563EB] px-4 py-4 font-display text-[22px] uppercase tracking-wider text-white shadow-[0_10px_0_#1E3A8A,0_15px_20px_rgba(0,0,0,0.4),inset_0_4px_0_rgba(255,255,255,0.4)] transition hover:brightness-110 active:translate-y-[6px] active:shadow-[0_4px_0_#1E3A8A,0_5px_10px_rgba(0,0,0,0.4),inset_0_4px_0_rgba(255,255,255,0.4)]"
          onClick={() => navigate('/', { replace: true })}
          type="button"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
        >
          {ui.backHome}
        </button>
        <button
          className="w-full max-w-[340px] rounded-[30px] border-[5px] border-[#C2410C] bg-gradient-to-b from-[#FDBA74] via-[#F97316] to-[#EA580C] px-4 py-4 font-display text-[22px] uppercase tracking-wider text-white shadow-[0_10px_0_#9A3412,0_15px_20px_rgba(0,0,0,0.4),inset_0_4px_0_rgba(255,255,255,0.4)] transition hover:brightness-110 active:translate-y-[6px] active:shadow-[0_4px_0_#9A3412,0_5px_10px_rgba(0,0,0,0.4),inset_0_4px_0_rgba(255,255,255,0.4)]"
          onClick={() => console.log('ver puntuacion detallada')}
          type="button"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
        >
          {ui.scoreDetails}
        </button>
      </div>
      
      <style>{`
        .arcade-coin {
          position: absolute;
          border-radius: 50%;
          border: 3px solid #D68B13;
          background: radial-gradient(circle at 30% 30%, #FFF3B0, #F2AC21 60%, #B77A14 100%);
          box-shadow: 0 4px 6px rgba(0,0,0,0.4), inset 0 -4px 0 rgba(183,122,20,0.8), inset 0 4px 0 rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .arcade-coin::after {
          content: '⭐';
          font-size: 50%;
          color: #D68B13;
          opacity: 0.6;
        }

        .arcade-coin-falling {
          position: absolute;
          top: -100px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 3px solid #D68B13;
          background: radial-gradient(circle at 30% 30%, #FFF3B0, #F2AC21 60%, #B77A14 100%);
          box-shadow: 0 4px 6px rgba(0,0,0,0.4), inset 0 -4px 0 rgba(183,122,20,0.8), inset 0 4px 0 rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: coinFall linear forwards;
        }
        .arcade-coin-falling::after {
          content: '⭐';
          font-size: 50%;
          color: #D68B13;
          opacity: 0.6;
        }

        @keyframes coinFall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
