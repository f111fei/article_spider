import { config } from './constants';
import * as wechat from './wechat';

wechat.start(config.name, config.wechat);