import * as THREE from 'three';
import { Vehicle } from './vehicle.js';
import { GameEvents, EVENTS } from './events.js';

// Fil rouge de la V1 : six missions enchaînées. Chaque mission déclare son
// contact (un point fixe dans la ville où on vient la lancer), ses
// prérequis et ses étapes, au format du moteur d'étapes de `missions.js`.
// Les positions sont toutes sur des axes de rue (x ou z multiple de 62),
// donc jamais dans un bâtiment.

const ROSA = { name: 'Rosa', where: new THREE.Vector3(0, 0, 155) }; // Vieille Ville
const KENJI = { name: 'Kenji', where: new THREE.Vector3(186, 0, -155) }; // Little Tokyo

const GARAGE = new THREE.Vector3(-186, 0, 170); // Zone Industrielle
const HIDEOUT = new THREE.Vector3(-124, 0, 248); // Zone Industrielle, gang local
const SCRAPYARD = new THREE.Vector3(-248, 0, 186); // Zone Industrielle
const WAREHOUSE = new THREE.Vector3(-186, 0, 248); // Zone Industrielle

const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// Point de rue à une distance comprise entre min et max d'une origine.
function roadPointAround(world, origin, min, max) {
  let best = world.randomRoadPoint();
  for (let i = 0; i < 40; i++) {
    const p = world.randomRoadPoint();
    const d = flat(p, origin);
    if (d >= min && d <= max) return p;
    if (Math.abs(d - (min + max) / 2) < Math.abs(flat(best, origin) - (min + max) / 2)) best = p;
  }
  return best;
}

// La place de stationnement (trottoir, jamais dans un bâtiment) la plus
// proche d'une origine — pour poser une voiture de mission à un endroit
// crédible, plutôt qu'à un simple décalage qui peut tomber dans un mur.
function nearestParkedSpot(world, origin) {
  let best = null;
  let bestD = Infinity;
  for (const spot of world.parkedSpots) {
    const d = flat(spot, origin);
    if (d < bestD) {
      best = spot;
      bestD = d;
    }
  }
  return best || { x: origin.x, z: origin.z, rot: 0 };
}

// Véhicule de mission : rangé avec les voitures garées pour qu'on puisse y
// monter, mais marqué `keep` pour ne pas être recyclé quand on s'éloigne.
function missionCar(mm, ctx, spec, pos, yaw, color) {
  const car = new Vehicle(ctx.scene, spec, pos, yaw, color);
  car.keep = true;
  ctx.traffic.parked.push(car);
  mm.onCleanup(() => {
    car.keep = false;
  });
  return car;
}

// Escouade de mission : retirée si la mission échoue, pour qu'un nouvel
// essai reparte d'une planque propre.
function missionSquad(mm, ctx, center, count) {
  const squad = ctx.enemies.spawnSquad(center, count, true);
  mm.onCleanup(() => {
    for (const e of squad) if (e.health > 0) ctx.enemies.despawn(e);
  });
  return squad;
}

const aliveIn = (squad) => squad.filter((e) => e.health > 0);

function nearestAlive(squad, from) {
  let best = null;
  for (const e of aliveIn(squad)) if (!best || flat(e.position, from) < flat(best.position, from)) best = e;
  return best;
}

// Abandon : descendu et parti à plus de 40 m de la voiture de mission.
const abandoned = (mm, ctx, car) => ctx.player.inVehicle !== car && flat(mm.playerPos(), car.pos) > 40;

// Assaut d'une planque : approche, élimination, butin. Partagé par deux missions.
function assaultSteps(mm, ctx, site, count, lootText) {
  let squad = [];
  return [
    {
      text: 'Approche de la planque — ils sont armés',
      color: 'escape',
      marker: () => site,
      check: () => flat(mm.playerPos(), site) < 70,
    },
    {
      text: () => `Élimine les hommes de main (${count} restants)`,
      color: 'escape',
      enter: () => {
        squad = missionSquad(mm, ctx, site, count);
      },
      track: () => nearestAlive(squad, mm.playerPos())?.position ?? site,
      failIf: () => flat(mm.playerPos(), site) > 170,
      failReason: 'Tu as quitté la planque',
      check: () => {
        const left = aliveIn(squad).length;
        mm.setObjective(`Élimine les hommes de main (${left} restant${left > 1 ? 's' : ''})`);
        return left === 0;
      },
    },
    {
      text: lootText,
      color: 'deliver',
      marker: () => site,
      check: () => mm.reachedMarker(5),
    },
  ];
}

function escapeStep(stars) {
  return {
    text: `La police arrive (${stars} étoiles) — sème-la`,
    color: 'escape',
    enter: (ctx, mm) => {
      ctx.police.addCrime(stars, mm.playerPos());
      GameEvents.emit(EVENTS.BIG_MESSAGE, { title: 'RECHERCHÉ', sub: 'Sème la police', tone: 'warn' });
    },
    marker: () => null,
    check: (ctx) => ctx.police.wanted === 0,
  };
}

export const STORY = [
  {
    id: 'intro',
    title: 'Bienvenue à San Felipe',
    contact: 'Downtown',
    where: new THREE.Vector3(0, 0, 31),
    requires: [],
    reward: 500,
    steps: (mm, ctx) => {
      let car = null;
      let dropPoint = null;
      return [
        {
          text: 'Rejoins le marqueur bleu à pied — ZQSD pour marcher, Maj pour courir',
          color: 'goto',
          // Un point de rue, jamais un simple décalage : ce dernier pouvait
          // tomber dans un bâtiment selon l'endroit où le joueur démarrait
          // (repéré en jeu le 24/09 — personnage collé à un mur).
          marker: () => roadPointAround(ctx.world, mm.playerPos(), 20, 35),
          check: () => mm.reachedMarker(5) && !ctx.player.inVehicle,
        },
        {
          text: 'Monte dans la voiture — approche-toi et appuie sur F',
          color: 'vehicle',
          enter: () => {
            const spot = nearestParkedSpot(ctx.world, mm.playerPos());
            car = missionCar(mm, ctx, 'berline', new THREE.Vector3(spot.x, 0, spot.z), spot.rot, 0x9c2f2f);
          },
          marker: () => car.pos,
          check: () => ctx.player.inVehicle === car,
        },
        {
          text: 'Conduis jusqu’au point vert',
          color: 'deliver',
          enter: () => {
            dropPoint = roadPointAround(ctx.world, mm.playerPos(), 140, 220);
          },
          marker: () => dropPoint,
          check: () => mm.reachedMarker(8),
        },
        {
          text: 'La police t’a repéré ! Sors du cercle rouge et perds-la',
          color: 'escape',
          enter: () => {
            ctx.police.addCrime(1, mm.playerPos());
            GameEvents.emit(EVENTS.BIG_MESSAGE, { title: 'RECHERCHÉ', sub: 'Sème la police', tone: 'warn' });
          },
          marker: () => null,
          check: () => ctx.police.wanted === 0,
        },
      ];
    },
  },

  {
    id: 'premier-contrat',
    title: 'Premier contrat',
    contact: ROSA.name,
    where: ROSA.where,
    requires: ['intro'],
    reward: 900,
    brief: 'Rosa : « Un client attend sa berline. Elle doit arriver entière. »',
    steps: (mm, ctx) => {
      let car = null;
      return [
        {
          text: 'Récupère la berline du client',
          color: 'vehicle',
          enter: () => {
            const spot = roadPointAround(ctx.world, ROSA.where, 110, 200);
            car = missionCar(mm, ctx, 'berline', spot, 0, 0x2f4f7a);
          },
          marker: () => car.pos,
          failIf: () => car.damage >= 70,
          failReason: 'La berline est trop abîmée',
          check: () => ctx.player.inVehicle === car,
        },
        {
          text: 'Livre-la au garage — sans la cabosser',
          color: 'deliver',
          time: Math.round(flat(ROSA.where, GARAGE) / 9 + 45),
          marker: () => GARAGE,
          failIf: () => car.damage >= 70 || abandoned(mm, ctx, car),
          failReason: 'Livraison ratée : la berline est abîmée ou abandonnée',
          check: () => mm.reachedMarker(9) && ctx.player.inVehicle === car,
        },
      ];
    },
  },

  {
    id: 'dette',
    title: 'Dette impayée',
    contact: KENJI.name,
    where: KENJI.where,
    requires: ['premier-contrat'],
    reward: 1500,
    brief: 'Kenji : « Un gang de la zone industrielle me doit de l’argent. Va le chercher. »',
    steps: (mm, ctx) => [
      ...assaultSteps(mm, ctx, HIDEOUT, 3, 'Récupère l’argent dans la planque'),
      escapeStep(2),
    ],
  },

  {
    id: 'mouchard',
    title: 'Le mouchard',
    contact: KENJI.name,
    where: KENJI.where,
    requires: ['dette'],
    reward: 1300,
    brief: 'Kenji : « Quelqu’un a parlé. Il roule en ville en ce moment. Ramène-moi sa voiture. »',
    steps: (mm, ctx) => {
      let target = null;
      return [
        {
          text: 'Rattrape le mouchard et sors-le de sa voiture (F)',
          color: 'escape',
          enter: () => {
            const from = mm.playerPos();
            const candidates = ctx.traffic.cars.filter((c) => c.driver && flat(c.vehicle.pos, from) > 30);
            candidates.sort((a, b) => flat(a.vehicle.pos, from) - flat(b.vehicle.pos, from));
            const pick = candidates[0];
            if (pick) {
              target = pick.vehicle;
              pick.desired *= 1.5; // il a compris qu'on le cherche
            } else {
              target = missionCar(mm, ctx, 'berline', roadPointAround(ctx.world, from, 60, 140), 0, 0x444a55);
            }
          },
          track: () => target.pos,
          failIf: () => !target.mesh.parent || flat(mm.playerPos(), target.pos) > 250,
          failReason: 'Il t’a semé',
          check: () => ctx.player.inVehicle === target,
        },
        {
          text: 'Amène sa voiture à la casse',
          color: 'deliver',
          time: 150,
          marker: () => SCRAPYARD,
          failIf: () => abandoned(mm, ctx, target),
          failReason: 'Tu as abandonné la voiture',
          check: () => mm.reachedMarker(9) && ctx.player.inVehicle === target,
        },
      ];
    },
  },

  {
    id: 'course',
    title: 'Contre la montre',
    contact: KENJI.name,
    where: KENJI.where,
    requires: ['mouchard'],
    reward: 1100,
    brief: 'Kenji : « Un pari. Cinq points de passage, un chrono serré. »',
    steps: (mm, ctx) => {
      const gates = [];
      let prev = KENJI.where;
      for (let i = 0; i < 5; i++) {
        prev = roadPointAround(ctx.world, prev, 90, 160);
        gates.push(prev);
      }
      let last = KENJI.where;
      return [
        {
          text: 'Prends un véhicule pour la course',
          color: 'vehicle',
          marker: () => null,
          check: () => !!ctx.player.inVehicle,
        },
        ...gates.map((gate, i) => {
          const from = last;
          last = gate;
          return {
            text: `Point de passage ${i + 1} / ${gates.length}`,
            color: 'deliver',
            time: Math.round(flat(from, gate) / 14 + 9),
            marker: () => gate,
            failIf: () => !ctx.player.inVehicle,
            failReason: 'Tu es descendu du véhicule',
            check: () => mm.reachedMarker(10),
          };
        }),
      ];
    },
  },

  {
    id: 'grand-coup',
    title: 'Le grand coup',
    contact: ROSA.name,
    where: ROSA.where,
    requires: ['course'],
    reward: 4000,
    final: true,
    brief: 'Rosa : « L’entrepôt du gang. Tout ce qu’ils ont amassé. On finit ça ce soir. »',
    steps: (mm, ctx) => [
      ...assaultSteps(mm, ctx, WAREHOUSE, 5, 'Prends le magot dans l’entrepôt'),
      escapeStep(3),
      {
        text: 'Rapporte le magot à Rosa',
        color: 'deliver',
        marker: () => ROSA.where,
        check: () => mm.reachedMarker(6),
      },
    ],
  },
];

export const STORY_BY_ID = Object.fromEntries(STORY.map((d) => [d.id, d]));
