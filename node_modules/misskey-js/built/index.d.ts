import { Endpoints } from './api.types';
import Stream, { Connection } from './streaming';
import { Channels } from './streaming.types';
import { Acct } from './acct';
export { Endpoints, Stream, Connection as ChannelConnection, Channels, Acct, };
export declare const permissions: string[];
export declare const notificationTypes: readonly ["follow", "mention", "reply", "renote", "quote", "reaction", "pollVote", "pollEnded", "receiveFollowRequest", "followRequestAccepted", "groupInvited", "app"];
export declare const noteVisibilities: readonly ["public", "home", "followers", "specified"];
export declare const mutedNoteReasons: readonly ["word", "manual", "spam", "other"];
export declare const ffVisibility: readonly ["public", "followers", "private"];
import * as api from './api';
import * as entities from './entities';
export { api, entities };
//# sourceMappingURL=index.d.ts.map