// R!OT OS Generative Engine: riot-poster-engine
export function setupSketch(p: any, container: HTMLElement) {
  p.setup = () => {
    p.createCanvas(container.clientWidth || 400, 200).parent(container);
    p.background(17, 17, 15);
  };
  p.draw = () => {
    p.stroke(215, 255, 0);
    p.strokeWeight(2);
    p.line(p.random(p.width), p.random(p.height), p.random(p.width), p.random(p.height));
    if (p.frameCount > 100) p.noLoop();
  };
}
