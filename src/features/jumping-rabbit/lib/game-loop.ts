export function canAdvanceRabbitWorld(running: boolean, paused: boolean, finished: boolean) {
  return running && !paused && !finished;
}
