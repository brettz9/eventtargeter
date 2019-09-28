import {expect} from 'chai';
import {ShimEventTarget} from '../dist/index.js';

global.expect = expect;
global.ShimEventTarget = ShimEventTarget;
