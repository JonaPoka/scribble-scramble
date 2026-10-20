#!/usr/bin/env node
// Creates minigames/<id>/ from minigames/_template. Usage: npm run new-minigame hot-potato
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const id = process.argv[2];
if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error('Usage: npm run new-minigame <id>');
  console.error('The id becomes the folder name: lower-case letters, digits and dashes, e.g. hot-potato');
  process.exit(1);
}

const template = fileURLToPath(new URL('../minigames/_template/', import.meta.url));
const target = fileURLToPath(new URL(`../minigames/${id}/`, import.meta.url));
if (existsSync(target)) {
  console.error(`minigames/${id} already exists. Pick another id or edit that folder.`);
  process.exit(1);
}

cpSync(template, target, { recursive: true });

// Name the copy after its id: "hot-potato" -> "Hot Potato", and give the view component a matching name.
const title = id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const component = title.replace(/[^A-Za-z0-9]/g, '') || 'Minigame';
const prefix = id.replace(/-/g, '').slice(0, 6);
const edit = (file, fn) => writeFileSync(target + file, fn(readFileSync(target + file, 'utf8')));
edit('meta.ts', (s) => s.replace("name: 'Button Mash'", `name: '${title}'`));
edit('client.tsx', (s) => s.replace('function ButtonMash(', `function ${/^[A-Za-z]/.test(component) ? component : 'Minigame'}(`).replaceAll('tpl', prefix));
edit('style.css', (s) => s.replaceAll('tpl', prefix));

console.log(`Created minigames/${id}/ from the template (a working "tap as fast as you can" game).

Next:
  1. npm run dev, then start a game: "${title}" is already in the rotation.
  2. Edit minigames/${id}/meta.ts, protocol.ts, server.ts and client.tsx to make it your own.
  3. Guide: docs/creating-minigames.md`);
