// Moonwitness Skin Layer -- Reusable Effect Classes
import type { EffectToken } from '../dna/tokens';

export function halftone(options: Partial<EffectToken['halftone']> = {}): string {
  const { dotSize = '1px', spacing = '7px', opacity = 0.08, color = { hex: '#ffffff' } } = options;
  return 'background-image: radial-gradient(' + color.hex + '80 ' + dotSize + ', transparent ' + (parseFloat(dotSize) * 1.6) + 'px); background-size: ' + spacing + ' ' + spacing + ';';
}

export function grain(options: Partial<EffectToken['grain']> = {}): string {
  const { opacity = 0.5, blendMode = 'overlay', size = '160px' } = options;
  return 'position: relative; &::after { content: "; position: absolute; inset: 0; pointer-events: none; opacity: ' + opacity + '; mix-blend-mode: ' + blendMode + '; }';
}

export function cmykSlip(options: Partial<EffectToken['cmykSlip']> = {}): string {
  const { offset = '2px', cyan = { hex: '#2ea8ff' }, magenta = { hex: '#ff2d78' } } = options;
  return 'position: relative; transition: text-shadow 0.15s ease; &:hover { text-shadow: ' + offset + ' 0 0 ' + cyan.hex + ', -' + offset + ' 0 0 ' + magenta.hex + '; }';
}

export function duotone(options: Partial<EffectToken['duotone']> = {}): string {
  const { gradient = 'linear-gradient(155deg, #ff2d78 0%, #a5166a 45%, #2ea8ff 100%)', blendMode = 'color', opacity = 0.9 } = options;
  return 'position: relative; filter: grayscale(1) contrast(1.5) brightness(0.82); &::before { content: "; position: absolute; inset: 0; pointer-events: none; background: ' + gradient + '; mix-blend-mode: ' + blendMode + '; opacity: ' + opacity + '; }';
}

export function tape(options: Partial<EffectToken['tape']> = {}): string {
  const { width = '92px', height = '26px', opacity = 0.28, blur = '1px' } = options;
  return 'position: absolute; width: ' + width + '; height: ' + height + '; background: rgba(244, 238, 222, ' + opacity + '); backdrop-filter: blur(' + blur + '); box-shadow: 0 1px 3px rgba(0,0,0,0.4);';
}

export function sticker(options: Partial<EffectToken['sticker']> = {}): string {
  const { clipPath = 'polygon(1% 4%, 4% 1%, 9% 3%, 15% 0%, 22% 2%, 30% 1%, 38% 3%, 47% 0%, 55% 2%, 63% 1%, 71% 3%, 79% 0%, 87% 2%, 94% 1%, 99% 4%, 100% 12%, 98% 20%, 100% 30%, 98% 41%, 100% 52%, 98% 63%, 100% 74%, 98% 85%, 100% 93%, 97% 99%, 90% 97%, 82% 100%, 74% 98%, 66% 100%, 58% 98%, 50% 100%, 42% 98%, 34% 100%, 26% 98%, 18% 100%, 10% 98%, 4% 100%, 0% 96%, 1% 88%, 0% 78%, 2% 68%, 0% 57%, 1% 46%, 0% 36%, 2% 26%, 0% 15%)', rotation = '-2deg' } = options;
  return 'clip-path: ' + clipPath + '; transform: rotate(' + rotation + ');';
}

export function brushUnderline(options: Partial<EffectToken['brushUnderline']> = {}): string {
  const { height = '0.28em', color = { hex: '#ffd21f' }, position = '92%' } = options;
  return 'background-image: linear-gradient(100deg, transparent 1%, ' + color.hex + ' 4%, ' + color.hex + ' 96%, transparent 99%); background-repeat: no-repeat; background-size: 100% ' + height + '; background-position: 0 ' + position + '; padding: 0 0.08em;';
}

export function composeEffects(...effects: string[]): string {
  return effects.filter(Boolean).join(' ');
}

export const effectPresets = {
  riot: composeEffects(halftone({ dotSize: '1.2px', spacing: '8px', opacity: 0.22, color: { hex: '#ff2d78' } }), grain({ opacity: 0.18 }), cmykSlip({ offset: '2px' })),
  editorial: composeEffects(duotone({ opacity: 0.6 }), brushUnderline({ height: '0.35em', color: { hex: '#ffd21f' } })),
  technical: '',
  archive: composeEffects(grain({ opacity: 0.3, size: '200px' }), brushUnderline({ color: { hex: '#ffd21f' } })),
  transmission: composeEffects(halftone({ dotSize: '1px', spacing: '4px', opacity: 0.1, color: { hex: '#2ea8ff' } }), grain({ opacity: 0.25, blendMode: 'screen' })),
  print: '',
  highContrast: '',
  lowMotion: composeEffects(grain({ opacity: 0 }), cmykSlip({ offset: '0' })),
};
