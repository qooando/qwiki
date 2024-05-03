#!/bin/env node

import {dirname} from "node:path";
import { fileURLToPath } from "node:url";

// var __filename = fileURLToPath(import.meta.url);
// var __dirname = dirname(__filename);

import {Qwiki} from "@qwiki/core/Qwiki";
var $qw = new Qwiki();
$qw.boot();
