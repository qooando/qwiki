#!/bin/env node

// https://github.com/aionic-org/aionic-core/tree/master
// https://dev.to/larswaechter/path-aliases-with-typescript-in-nodejs-4353
import 'module-alias/register';
import {Qwiki} from "./core/Qwiki";
var $qw = new Qwiki();
$qw.boot();
