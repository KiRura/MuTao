require("dotenv").config();
const { Client, GatewayIntentBits, PermissionFlagsBits, DiscordAPIError, ChannelType, ApplicationCommandOptionType, StageChannel } = require("discord.js");
const translate = require("deepl");
const client = new Client({ intents: Object.values(GatewayIntentBits) });
const API_KEY = process.env.DEEPL_API_KEY;
const { QueryType, Player, QueueRepeatMode, useQueue } = require("discord-player");
const discordplayer = Player.singleton(client);
discordplayer.extractors.loadDefault();
const wait = (sec) => {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });
};
const fetch = require("undici");
const { stream } = require("play-dl");
const ping = require("ping");
const { DiscordTogether } = require("discord-together");
const discordTogether = new DiscordTogether(client);
const fs = require("fs");
const cron = require("node-cron");
const Vision = require("@google-cloud/vision");
const vision = new Vision.ImageAnnotatorClient();

function writedefault(id) {
  let json = JSON.parse(fs.readFileSync("guilds.json"));
  json.push(
    {
      id: id,
      send_count_channel: null,
      countswitch: false,
      count: 0
    }
  );
  fs.writeFileSync("guilds.json", Buffer.from(JSON.stringify(json)));
};
function avatar_to_URL(user) {
  if (!user.id) return null;
  const avatar = user.avatarURL({ extension: "png", size: 4096 });
  return avatar ? avatar : `${user.defaultAvatarURL}?size=4096`;
};

client.once("ready", async () => {
  setInterval(async () => {
    const result = await ping.promise.probe("8.8.8.8");
    client.user.setActivity({ name: `${discordplayer.queues.cache.size} / ${(await client.guilds.fetch()).size} servers・${client.users.cache.size} users・${result.time}ms` });
  }, 60000);

  cron.schedule("59 59 23 * * *", async () => {
    const dt = new Date();
    const date = `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
    let json = JSON.parse(fs.readFileSync("guilds.json"));
    await Promise.all(json.map(async guild => {
      if (guild.countswitch) {
        let fetchguild;
        let fetchchannel;
        try {
          fetchguild = await client.guilds.fetch(guild.id);
          fetchchannel = await fetchguild.channels.fetch(guild.send_count_channel);
        } catch (error) {
          return;
        };
        const result = await fetchchannel.send({
          embeds: [
            {
              author: {
                name: fetchguild.name,
                icon_url: fetchguild.iconURL({extension: "png", size: 4096})
              },
              description: `メッセージ数: ${guild.count}`,
              color: 3066993,
              footer: {
                text: `日付: ${date}`
              }
            }
          ]
        });
        json.find(jsonguild => jsonguild.id === guild.id).count = 0;
        fs.writeFileSync("guilds.json", Buffer.from(JSON.stringify(json)));
      };
    }));
  });

  const data = [
    { // help
      name: "help",
      description: "注意書き等"
    },
    { // ping
      name: "ping",
      description: "遅延"
    },
    { // leave
      name: "leave",
      description: "キューを削除しVCから退出"
    },
    { // play
      name: "play",
      description: "URL先の音源を再生する(YouTube等)/検索も可",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "url",
          description: "URLもしくは検索",
          required: true
        },
        {
          type: ApplicationCommandOptionType.Channel,
          name: "vc",
          description: "再生先のVC",
          channelTypes: [ChannelType.GuildVoice]
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "vol",
          description: "管理者無: 1~50%・有: 1~100% | デフォルト: 30%",
          minValue: 1,
          maxValue: 100
        }
      ]
    },
    { // pause
      name: "pause",
      description: "再生中の音源を一時停止"
    },
    { // unpause
      name: "unpause",
      description: "一時停止を解除"
    },
    { // userinfo
      name: "userinfo",
      description: "ユーザー情報を表示",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "id",
          description: "ID",
          required: true
        }
      ]
    },
    { // role
      name: "role",
      description: "ロール管理",
      options: [
        {
          type: ApplicationCommandOptionType.SubcommandGroup,
          name: "user",
          description: "特定のユーザーのロールを管理",
          options: [
            {
              // /role user add
              type: ApplicationCommandOptionType.Subcommand,
              name: "add",
              description: "追加",
              options: [
                {
                  type: ApplicationCommandOptionType.User,
                  name: "user",
                  description: "ユーザー",
                  required: true
                },
                {
                  type: ApplicationCommandOptionType.Role,
                  name: "role",
                  description: "ロール",
                  required: true
                }
              ]
            },
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: "remove",
              description: "削除",
              options: [
                {
                  type: ApplicationCommandOptionType.User,
                  name: "user",
                  description: "ユーザー",
                  required: true
                },
                {
                  type: ApplicationCommandOptionType.Role,
                  name: "role",
                  description: "ロール",
                  required: true
                }
              ]
            },
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: "list",
              description: "一覧",
              options: [
                {
                  type: ApplicationCommandOptionType.User,
                  name: "user",
                  description: "ユーザー",
                  required: true
                }
              ]
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.SubcommandGroup,
          name: "all",
          description: "全てのユーザーのロールを管理",
          options: [
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: "add",
              description: "追加",
              options: [
                {
                  type: ApplicationCommandOptionType.Role,
                  name: "role",
                  description: "ロール",
                  required: true
                },
                {
                  type: ApplicationCommandOptionType.Boolean,
                  name: "ignorebot",
                  description: "botを除外する"
                }
              ]
            },
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: "remove",
              description: "削除",
              options: [
                {
                  type: ApplicationCommandOptionType.Role,
                  name: "role",
                  description: "ロール",
                  required: true
                },
                {
                  type: ApplicationCommandOptionType.Boolean,
                  name: "ignorebot",
                  description: "botを除外する"
                }
              ]
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.SubcommandGroup,
          name: "allbot",
          description: "全てのbotのロールを管理",
          options: [
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: "add",
              description: "追加",
              options: [
                {
                  type: ApplicationCommandOptionType.Role,
                  name: "role",
                  description: "ロール",
                  required: true
                }
              ]
            },
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: "remove",
              description: "削除",
              options: [
                {
                  type: ApplicationCommandOptionType.Role,
                  name: "role",
                  description: "ロール",
                  required: true
                }
              ]
            }
          ]
        }
      ]
    },
    { // clear
      name: "clear",
      description: "キューをVCから退出せずに削除する"
    },
    { // test
      name: "test",
      description: "おいフータオ！ピンポンしようぜ！",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "text1",
          description: "色々1"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "text2",
          description: "色々2"
        },
        {
          type: ApplicationCommandOptionType.Attachment,
          name: "attachment",
          description: "ファイル"
        }
      ]
    },
    { // siranami
      name: "siranami",
      description: "シラナミのチャンネルを表示"
    },
    { // ggrks
      name: "ggrks",
      description: "ggrks"
    },
    { // getthumbnail
      name: "getthumbnail",
      description: "YouTubeのサムネを取得",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "url",
          description: "YouTube URL",
          required: true
        }
      ]
    },
    { // transdeepl
      name: "trans",
      description: "DeepLで翻訳する",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "sourcetext",
          description: "翻訳する文",
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "outlang",
          description: "翻訳先の言語",
          required: true,
          choices: [
            {
              name: "JA",
              value: "JA"
            },
            {
              name: "EN-GB",
              value: "EN-GB"
            },
            {
              name: "EN-US",
              value: "EN-US"
            },
            {
              name: "ES",
              value: "ES"
            },
            {
              name: "BG",
              value: "BG"
            },
            {
              name: "CS",
              value: "CS"
            },
            {
              name: "DA",
              value: "DA"
            },
            {
              name: "DE",
              value: "DE"
            },
            {
              name: "EL",
              value: "EL"
            },
            {
              name: "ET",
              value: "ET"
            },
            {
              name: "FR",
              value: "FR"
            },
            {
              name: "ID",
              value: "ID"
            },
            {
              name: "IT",
              value: "IT"
            },
            {
              name: "LT",
              value: "LT"
            },
            {
              name: "LV",
              value: "LV"
            },
            {
              name: "PL",
              value: "PL"
            },
            {
              name: "PT-BR",
              value: "PT-BR"
            },
            {
              name: "PT-PT",
              value: "PT-PT"
            },
            {
              name: "RO",
              value: "RO"
            },
            {
              name: "RU",
              value: "RU"
            },
            {
              name: "SL",
              value: "SL"
            },
            {
              name: "SV",
              value: "SV"
            },
            {
              name: "TR",
              value: "TR"
            },
            {
              name: "UK",
              value: "UK"
            },
            {
              name: "ZH",
              value: "ZH"
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "sourcelang",
          description: "翻訳する文の言語",
          choices: [
            {
              name: "JA",
              value: "JA"
            },
            {
              name: "EN",
              value: "EN"
            },
            {
              name: "ES",
              value: "ES"
            },
            {
              name: "BG",
              value: "BG"
            },
            {
              name: "CS",
              value: "CS"
            },
            {
              name: "DA",
              value: "DA"
            },
            {
              name: "DE",
              value: "DE"
            },
            {
              name: "EL",
              value: "EL"
            },
            {
              name: "ET",
              value: "ET"
            },
            {
              name: "FR",
              value: "FR"
            },
            {
              name: "ID",
              value: "ID"
            },
            {
              name: "IT",
              value: "IT"
            },
            {
              name: "LT",
              value: "LT"
            },
            {
              name: "LV",
              value: "LV"
            },
            {
              name: "NL",
              value: "NL"
            },
            {
              name: "PL",
              value: "PL"
            },
            {
              name: "PT",
              value: "PT"
            },
            {
              name: "RO",
              value: "RO"
            },
            {
              name: "RU",
              value: "RU"
            },
            {
              name: "SK",
              value: "SK"
            },
            {
              name: "SL",
              value: "SL"
            },
            {
              name: "SV",
              value: "SV"
            },
            {
              name: "TR",
              value: "TR"
            },
            {
              name: "UK",
              value: "UK"
            },
            {
              name: "ZH",
              value: "ZH"
            }
          ]
        }
      ]
    },
    { // today
      name: "today",
      description: "今日の日付を表示する。"
    },
    { // queue
      name: "queue",
      description: "キューを表示する",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "page",
          description: "ページ",
          minValue: 1
        }
      ]
    },
    { // skip
      name: "skip",
      description: "再生中の曲か指定した曲数スキップする",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "number",
          description: "スキップする曲数"
        }
      ]
    },
    { // nowp
      name: "nowp",
      description: "再生中の曲の詳細を表示"
    },
    { // loop
      name: "loop",
      description: "再生中の曲をループ",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "mode",
          description: "track: 1曲だけ, queue: キューをループ, autoplay: おすすめの曲を勝手に追加し続ける(無限ループに陥りやすい), off: 解除",
          required: true,
          choices: [
            {
              name: "track",
              value: QueueRepeatMode.TRACK
            },
            {
              name: "queue",
              value: QueueRepeatMode.QUEUE
            },
            {
              name: "autoplay",
              value: QueueRepeatMode.AUTOPLAY
            },
            {
              name: "off",
              value: QueueRepeatMode.OFF
            }
          ]
        }
      ]
    },
    { // remove
      name: "remove",
      description: "指定したキュー内の曲を削除する。",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "number",
          description: "/queueでタイトルの左に表示された番号",
          required: true
        }
      ]
    },
    { // history
      name: "songhistory",
      description: "VCに接続した時から今までに追加した曲を表示する。",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "page",
          description: "ページ",
        }
      ]
    },
    { // riseki
      name: "riseki",
      description: "ニックネームに「(離席)」を追加する",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "word",
          description: "括弧内の文字をカスタム"
        }
      ]
    },
    { // shuffle
      name: "shuffle",
      description: "キュー内をかき混ぜる"
    },
    { // songinfo
      name: "songinfo",
      description: "指定した番号の曲の情報を表示する",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "number",
          description: "/queueの番号",
          minValue: 0
        }
      ]
    },
    { // setvolume
      name: "setvolume",
      description: "ボリュームを設定する",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "vol",
          description: "管理者無: 1~50%・有: 1~100% | デフォルト: 30%",
          minValue: 1,
          maxValue: 100,
          required: true
        }
      ]
    },
    { // searchimage
      name: "searchimage",
      description: "画像検索",
      options: [
        {
          type: ApplicationCommandOptionType.Attachment,
          name: "image",
          description: "画像",
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "url",
          description: "画像のURL"
        }
      ]
    },
    { // avatar
      name: "avatar",
      description: "指定したIDやメンバーのアイコンを取得する",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "id",
          description: "ID"
        },
        {
          type: ApplicationCommandOptionType.User,
          name: "member",
          description: "メンバー"
        }
      ]
    },
    { // startactivity
      name: "startactivity",
      description: "アクティビティに入れるURLを生成する",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "activity",
          description: "アクティビティの名前",
          choices: [
            {
              name: "Watch Together",
              value: "youtube"
            },
            {
              name: "Poker Night",
              value: "poker"
            },
            {
              name: "Chess In The Park",
              value: "chess"
            },
            {
              name: "Checkers In The Park",
              value: "checkers"
            },
            {
              name: "Betrayal",
              value: "betrayal"
            },
            {
              name: "Fishing",
              value: "fishing"
            },
            {
              name: "Letter League",
              value: "lettertile"
            },
            {
              name: "Words snack",
              value: "wordsnack"
            },
            {
              name: "Doodle Crew",
              value: "doodlecrew"
            },
            {
              name: "SpellCast",
              value: "spellcast"
            },
            {
              name: "Awkword",
              value: "awkword"
            },
            {
              name: "Putt Party",
              value: "puttparty"
            },
            {
              name: "Sketch Heads",
              value: "sketchheads"
            },
            {
              name: "Blazing 8s",
              value: "ocho"
            }
          ],
          required: true
        }
      ]
    },
    { // saveemoji
      name: "saveemoji",
      description: "指定した絵文字を画像にする",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "emojiid",
          description: "絵文字のID(絵文字をそのまま入力すると分解した結果が返って来ます。)",
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "type",
          description: "拡張子",
          choices: [
            {
              name: "png",
              value: "png"
            },
            {
              name: "gif",
              value: "gif"
            }
          ]
        }
      ]
    },
    { // disconall
      name: "disconall",
      description: "VC内にいる全員を退出させる",
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "vc",
          description: "VC",
          channelTypes: [ChannelType.GuildVoice]
        }
      ]
    },
    { // messages
      name: "messages",
      description: "0:00から今までにサーバー内で送信されたメッセの総数"
    },
    { // banner
      name: "banner",
      description: "バナーを保存する",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "id",
          description: "ID"
        },
        {
          type: ApplicationCommandOptionType.User,
          name: "member",
          description: "メンバー"
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "gif",
          description: "gifの場合はTrueを選択"
        }
      ]
    },
    { // getroleicon
      name: "getroleicon",
      description: "ロールアイコンを取得する",
      options: [
        {
          type: ApplicationCommandOptionType.Role,
          name: "role",
          description: "ロール",
          required: true
        }
      ]
    },
    { // send
      name: "send",
      description: "埋め込みを送る",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "description",
          description: "説明文",
          required: true
        },
        {
          type: ApplicationCommandOptionType.Channel,
          name: "channel",
          description: "送信先のチャンネル",
          channelTypes: [ChannelType.GuildText],
          required: true
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "embed",
          description: "埋め込みか否か",
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "title",
          description: "タイトル"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "url",
          description: "タイトル文字のURL"
        },
        {
          type: ApplicationCommandOptionType.Attachment,
          name: "attachmentimage",
          description: "画像(アップ)"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "urlimage",
          description: "画像(URL)"
        },
        {
          type: ApplicationCommandOptionType.Attachment,
          name: "attachmentthumbnail",
          description: "サムネイル(アップ)"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "urlthumbnail",
          description: "サムネイル(URL)"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "authortext",
          description: "一番上の小さい文字"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "authorurl",
          description: "一番上の小さい文字のURL"
        },
        {
          type: ApplicationCommandOptionType.Attachment,
          name: "attachmentauthorimage",
          description: "一番上の小さい画像(アップ)"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "urlauthorimage",
          description: "一番上の小さい画像(URL)"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "footertext",
          description: "一番下の小さい文字"
        },
        {
          type: ApplicationCommandOptionType.Attachment,
          name: "attachmentfooterimage",
          description: "一番下の小さい画像(アップ)"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "urlfooterimage",
          description: "一番下の小さい画像(URL)"
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "color",
          description: "10進数のカラーコード",
          maxValue: 16777215
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "hexcolor",
          description: "16進数のカラーコード"
        }
      ]
    },
    { // deafall
      name: "deafall",
      description: "VC内の全員をサーバースピーカーミュートする",
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "vc",
          description: "VC",
          channelTypes: [ChannelType.GuildVoice]
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "cancel",
          description: "ミュート解除"
        }
      ]
    },
    { // seek
      name: "seek",
      description: "シークバーをいじいじする",
      options: [
        {
          type: ApplicationCommandOptionType.Number,
          name: "duration",
          description: "秒数",
          required: true
        }
      ]
    },
    { // setchannel
      name: "setchannel",
      description: "1日のカウント数を日本時間0時に送信するチャンネルを設定する。(送信後はカウントがリセットされます)",
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "channel",
          description: "チャンネル",
          channelTypes: [ChannelType.GuildText],
          required: true
        }
      ]
    },
    { // stopcount
      name: "stopcount",
      description: "メッセージ数のカウントを止める。(再有効化は/setchannelで)"
    },
    { // delmessages
      name: "delmessages",
      description: "直前の指定した数のメッセージを全て削除する。",
      options: [
        {
          type: ApplicationCommandOptionType.Channel,
          name: "channel",
          description: "削除するメッセージ達のチャンネル",
          required: true,
          channelTypes: [ChannelType.GuildText]
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: "number",
          description: "削除するメッセージ数(1~100)",
          required: true,
          minValue: 1,
          maxValue: 100
        }
      ]
    },
    { // deeplusage
      name: "deeplusage",
      description: "このBotのDeepLの使用状況を取得する。"
    },
    { // scantext
      name: "scantext",
      description: "画像から文字を取り出す",
      options: [
        {
          type: ApplicationCommandOptionType.Attachment,
          name: "attachment",
          description: "直接アップロード"
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "url",
          description: "URL"
        }
      ]
    }
  ];
  await client.application.commands.set(data);
  console.log(`${client.user.tag} 準備完了`);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isCommand()) return;

    const adminicon = (await client.users.fetch("606093171151208448")).avatarURL({ extension: "png", size: 4096 });
    const adminname = (await client.users.fetch("606093171151208448")).username;
    const mutaocolor = 16760703;
    const redcolor = 16744319;

    if (interaction.command.name === "help") {
      const result = await ping.promise.probe("8.8.8.8");
      await interaction.reply({
        embeds: [{
          description: "サポート鯖: https://discord.gg/ky97Uqu3YY\n**注意点**\n・音楽再生中にVCを移動させるとキューが消えます。仕様です。\n・/songhistoryの合計時間は/skipすると現実時間よりも長い時間になります。\n・/setvolumeについて...実行した人が管理者権限を持っているか否かに基づいて制限が取っ払われます\n・メッセージカウント機能は/setchannelで有効化、/stopcountで無効化、/messagesで現時点のメッセージ数を送信します。\n・日本時間0時に/setchannelで指定したチャンネルに当日末時点のメッセージ数を送信し、カウントをリセットします。\n・デバッグが行き届いていない箇所が多いためじゃんじゃん想定外の事をして下さい。",
          color: mutaocolor,
          footer: {
            icon_url: `${adminicon}`,
            text: `Made by ${adminname}・${result.time}ms`
          }
        }]
      });
    };

    if (interaction.command.name === "ping") {
      const result = await ping.promise.probe("8.8.8.8");
      if (result.time === "unknown") return await interaction.reply({ content: "なんかpingできませんでした。", ephemeral: true });
      let message = `**Websocket:** ${client.ws.ping}ms\n**API Endpoint:** please wait...\n**ping 8.8.8.8:** ${result.time}ms`
      await interaction.reply(message);
      const msg = await interaction.fetchReply();
      await interaction.editReply(message.replace("please wait...", `${msg.createdTimestamp - interaction.createdTimestamp}ms`));
    };

    if (interaction.command.name === "play") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      if (!interaction.guild.members.me.voice.channel) { // undefined回避
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Connect) && !interaction.guild.members.me.permissionsIn(interaction.member.voice.channel).has(PermissionFlagsBits.Connect)) return await interaction.reply({ content: "VCに接続できる権限が無いよ！", ephemeral: true });
      };

      await interaction.deferReply(); // タイムアウト防止
      const url = await interaction.options.getString("url");
      let vc = await interaction.options.getChannel("vc");
      vc = vc ? vc : interaction.member.voice.channel;
      vc = vc ? vc : interaction.guild.members.me.voice.channel;
      if (!vc) return await interaction.followUp("playコマンド\nVCに入るか\nVC指定するか");
      const volume = await interaction.options.getInteger("vol");
      let vol = volume ? volume : 30;
      if (vol > 50 && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) vol = 50;

      const track = await discordplayer.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO
      });
      if (!track.hasTracks()) return await interaction.followUp("何かしらの原因により処理できません。");

      const getqueue = useQueue(interaction.guild.id);
      const urlboolean = (url.match("http://") || url.match("https://"));
      const queuesize = urlboolean ? (getqueue ? getqueue.getSize() : 0) + track.tracks.length : (getqueue ? getqueue.getSize() : 0) + 1;
      const queuenumber = getqueue ? `${getqueue.getSize() + 1}番目に追加｜キュー内合計: ${queuesize}曲` : "再生開始";

      let queue;
      try {
        queue = await discordplayer.play(vc, track, {
          nodeOptions: {
            metadata: {
              channel: interaction.channel,
              client: interaction.guild.members.me,
              requestedBy: interaction.user
            },
            volume: vol
          }
        });
      } catch (error) {
        return await interaction.followUp(`処理中にエラーが発生しました。\n${error}`);
      };

      let t; let description; let thumbnail;

      if (track.hasPlaylist()) {
        t = track.playlist;
        thumbnail = t.tracks[0].thumbnail;
        description = `**合計時間:** ${t.estimatedDuration === 0 ? "ライブのみ" : t.durationFormatted}\n**曲数:** ${t.tracks.length}曲`;
      } else {
        t = track.tracks[0];
        thumbnail = t.thumbnail;
        description = `**投稿者:** ${t.author}\n**長さ:** ${t.durationMS === 0 ? "ライブ" : t.duration}`;
      };
      if (!urlboolean) description = `${description}\n**検索ワード:** ${url.substring(0, 15)}${url.length > 15 ? "..." : ""}`;

      if (!getqueue) queue.queue.history.push(queue.queue.currentTrack);
      await interaction.followUp({
        embeds: [
          {
            title: t.title,
            description: description,
            thumbnail: { url: thumbnail },
            footer: { text: queuenumber },
            url: t.url,
            color: mutaocolor
          }
        ]
      });
    };

    if (interaction.command.name === "leave") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      await interaction.deferReply();

      queue.delete();
      await interaction.followUp("またね！");
      await wait(3); // そういう演出
      await interaction.deleteReply();
    };

    if (interaction.command.name === "pause") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      queue.node.pause() ? await interaction.reply("一時停止したよ") : await interaction.reply({ content: "既に一時停止中だよ！", ephemeral: true }); // deferReply/followUpをするとephemeralが使えないらしい
    };

    if (interaction.command.name === "unpause") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      queue.node.resume() ? await interaction.reply("一時停止を解除したよ") : await interaction.reply({ content: "一時停止がされてなかったよ", ephemeral: true });
    };

    if (interaction.command.name === "clear") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      if (queue.getSize() === 0) return await interaction.reply({ content: "キューの中は既に再生中の曲だけだよ！", ephemeral: true });
      const losttracks = queue.getSize() - 1;

      await interaction.deferReply();
      queue.tracks.clear();
      await interaction.followUp(`${losttracks}曲がダイソンの手によってまっさらになったよ`);
    };

    if (interaction.command.name === "queue") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      let page = interaction.options.getInteger("page");
      if (page === null) page = 1;
      const maxpages = (Math.floor(queue.getSize() / 10)) + 1;
      if (page > maxpages) return await interaction.reply({ content: "ページ数があたおか", ephemeral: true });

      await interaction.deferReply(); // タイムアウト防止

      const pageStart = 10 * (page - 1); // 埋め込み作り☆
      const pageEnd = pageStart + 10;
      const tracks = queue.tracks.toArray().slice(pageStart, pageEnd).map((m, i) => { // ですくりぷしょん
        return `**${i + pageStart + 1}.** (${m.duration === "0:00" ? "ライブ" : m.duration}) [${m.title.length <= 20 ? m.title : `${m.title.substring(0, 20)}...`}](${m.url})`
      });

      let queuelength;
      const length = (queue.estimatedDuration + (queue.currentTrack.durationMS - queue.node.streamTime)) / 1000; // 再生中の曲の長さが含まれてないから足す
      if (queue.estimatedDuration === 0) {
        queuelength = "ライブ配信のみ";
      } else {
        const hours = ("00" + Math.floor(length / 3600)).slice(-2)
        const minutes = ("00" + Math.floor((length % 3600) / 60)).slice(-2)
        const seconds = ("00" + Math.floor((length % 3600) % 60)).slice(-2)
        if (hours !== "00") {
          queuelength = `キュー内合計: ${hours}:${minutes}:${seconds}`;
        } else if (minutes !== "00") {
          queuelength = `キュー内合計: ${minutes}:${seconds}`;
        } else {
          queuelength = `キュー内合計: 00:${seconds}`;
        };
      };

      let streamtime; // 埋め込みの文章
      if (queue.currentTrack.durationMS === 0) {
        streamtime = "ライブ";
      } else {
        const length = (queue.node.streamTime / 1000);
        const minutes = Math.floor(length / 60);
        let seconds = Math.floor(length % 60);
        if (seconds.toString().length === 1) seconds = `0${seconds}`;
        streamtime = `${minutes}:${seconds}/${queue.currentTrack.duration}`;
      };

      return await interaction.followUp({
        embeds: [{
          title: queuelength,
          description: `**再生中:** (${streamtime}) [${queue.currentTrack.title.length <= 20 ? queue.currentTrack.title : `${queue.currentTrack.title.substring(0, 20)}...`}](${queue.currentTrack.url})\n\n${tracks.join("\n")}${queue.getSize() > pageEnd ? `\n**...**\n**他:** ${queue.getSize() - pageEnd}曲` : ``}`, // 表示したキューの後にいくつかの曲があったらその曲数を表示
          thumbnail: {
            url: queue.currentTrack.thumbnail
          },
          color: mutaocolor,
          footer: {
            text: `ページ: ${page}/${maxpages}`
          }
        }]
      });
    };

    if (interaction.command.name === "skip") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let number = interaction.options.getInteger("number");
      if (number && (number < 1 || number > queue.getSize())) return await interaction.reply({ content: "指定した数字があたおか", ephemeral: true });
      await interaction.deferReply();

      let t;
      if (queue.repeatMode === 3 && !queue.tracks.toArray()[0]) {
        queue.node.skip();
        await wait(5);

        t = queue.currentTrack;
      } else if (!queue.tracks.toArray()[0]) {
        await interaction.followUp("キューが空になったよ！またね！");
        await wait(1); // そういう演出
        queue.delete();
        await wait(2);
        await interaction.deleteReply();
        return;
      } else if (number) {
        number = number - 1;
        t = queue.tracks.toArray()[number];
        queue.node.skipTo(t);
      } else {
        t = queue.tracks.toArray()[0];
        queue.node.skip();
      };

      let embed = {
        embeds: [
          {
            description: `**再生開始:**\n[${t.title}](${t.url})\n**リクエスト者:** ${t.requestedBy.username}\n**長さ:** ${t.durationMS === 0 ? "ライブ" : t.duration}`,
            color: mutaocolor,
            thumbnail: { url: t.thumbnail }
          }
        ]
      };
      if (queue.getSize() !== 0) embed.embeds[0].title = `**残り:** ${queue.estimatedDuration === 0 ? "ライブのみ" : queue.durationFormatted} / ${queue.getSize()}曲`;
      if (number) embed.embeds[0].description = `${embed.embeds[0].description}\n${number + 1}曲スキップしました。`;
      await interaction.followUp(embed);
    };

    if (interaction.command.name === "nowp" || interaction.command.name === "songinfo") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let num = interaction.options.getInteger("number");
      if (num < 0 || num > queue.getSize()) return await interaction.reply({ content: "数字があたおか", ephemeral: true });
      const vol = queue.node.volume;

      let t; let time;
      if (interaction.command.name === "nowp" || !num) {
        t = queue.currentTrack;
        const progress = queue.node.createProgressBar(); // 埋め込み作り(discordplayer神)
        time = queue.node.getTimestamp().progress === Infinity ? "**ライブ配信**" : `\n\n**${progress}**`;
      } else {
        num = num - 1;
        t = queue.tracks.toArray()[num];
        time = `\n**長さ:** ${t.duration}`;
      };

      await interaction.reply({
        embeds: [
          {
            title: t.title,
            url: t.url,
            thumbnail: { url: t.thumbnail },
            description: `**投稿者:** ${t.author}\n**リクエスト:** ${t.requestedBy.username}${time}`,
            color: mutaocolor,
            footer: { text: `今までに${queue.history.getSize()}曲再生しました。｜ボリューム: ${vol}%` }
          }
        ]
      });
    };

    if (interaction.command.name === "loop") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      const mode = interaction.options.get("mode");
      if (queue.repeatMode === mode.value) return await interaction.reply({ content: "既にそのモードです！", ephemeral: true });
      queue.setRepeatMode(mode.value);
      let sendmode;

      if (mode.value === QueueRepeatMode.TRACK) {
        sendmode = "リピート対象を**1曲**に変えたよ！";
      } else if (mode.value === QueueRepeatMode.QUEUE) {
        sendmode = "リピート対象を**キュー**に変えたよ！";
      } else if (mode.value === QueueRepeatMode.AUTOPLAY) {
        sendmode = "リピートを**autoplay**に設定したよ！";
      } else if (mode.value === QueueRepeatMode.OFF) {
        sendmode = "リピートを**解除**したよ！";
      };
      await interaction.reply(sendmode);
    };

    if (interaction.command.name === "remove") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      const number = interaction.options.getInteger("number");
      const track = queue.tracks.toArray()[number - 1];

      if (number <= 0 || number > queue.getSize()) return await interaction.reply({ content: "指定した番号の曲は存在しません。", ephemeral: true });

      await interaction.deferReply();
      await interaction.followUp(`**${number}.** ${track.title}を削除したよ！`);
      queue.node.remove(track);
    };

    if (interaction.command.name === "songhistory") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let page = interaction.options.getInteger("page");
      if (page === null) page = 1;
      if (page < 1 || page > ((Math.floor(queue.history.getSize() / 10)) + 1)) return await interaction.reply({ content: "ページ数があたおか", ephemeral: true });
      if (queue.history.getSize() === 0) return await interaction.reply({ content: "履歴はまだ保存されていません", ephemeral: true });

      await interaction.deferReply();
      const pageEnd = (-10 * (page - 1)) - 1;
      const pageStart = (pageEnd - 10);
      const tracks = queue.history.tracks.toArray().slice(pageStart, pageEnd).reverse().map((m, i) => {
        return `**${i + (pageEnd * -1)}.** (${m.duration === "0:00" ? "ライブ" : m.duration}) [${m.title.substring(0, 20)}${m.title.length > 20 ? "..." : ""}](${m.url})`;
      });

      let trackslength
      if (queue.history.getSize() === 1) {
        trackslength = queue.node.streamTime;
      } else {
        const length = queue.history.tracks.toArray().slice(0, queue.history.getSize() - 1).map((m) => {
          return m.durationMS;
        });
        const reducer = (sum, currentValue) => sum + currentValue;
        trackslength = length.reduce(reducer) + queue.node.streamTime;
      };
      trackslength = trackslength / 1000;

      const hours = ("00" + Math.floor(trackslength / 3600)).slice(-2);
      const minutes = ("00" + Math.floor((trackslength % 3600) / 60)).slice(-2);
      const seconds = ("00" + Math.floor((trackslength % 3600) % 60)).slice(-2);
      if (hours !== "00") {
        trackslength = `${hours}:${minutes}:${seconds}`
      } else if (minutes !== "00") {
        trackslength = `${minutes}:${seconds}`
      } else {
        trackslength = `00:${seconds}`
      };
      if (trackslength === "00:00") {
        trackslength = "ライブ";
      };

      await interaction.followUp({
        embeds: [
          {
            title: `今までに${trackslength} / ${queue.history.getSize()}曲再生したよ！`,
            description: `**再生中:** (${queue.node.getTimestamp().progress === Infinity ? "ライブ" : `${queue.node.getTimestamp().current.label}/${queue.currentTrack.duration}`}) [${queue.currentTrack.title.substring(0, 20)}${queue.currentTrack.title.length > 20 ? "..." : ""}](${queue.currentTrack.url})\n\n${tracks.join("\n")}${queue.history.getSize() > (pageStart * -1) ? `\n**...**\n**他:** ${queue.history.getSize() + pageStart}曲` : ""}`,
            color: mutaocolor,
            thumbnail: {
              url: queue.currentTrack.thumbnail
            },
            footer: {
              text: `ページ: ${page}/${(Math.floor(queue.history.getSize() / 10)) + 1}`
            }
          }
        ]
      });
    };

    if (interaction.command.name === "shuffle") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      if (queue.getSize() === 1) return await interaction.reply({ content: "キュー内は1曲しか無いよ！", ephemeral: true });

      await interaction.deferReply();
      queue.tracks.shuffle();
      await interaction.followUp(`${queue.tracks.data.length}曲をぐしゃぐしゃにしたよ！`);
    };

    if (interaction.command.name === "setvolume") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let vol = interaction.options.getInteger("vol");
      if (vol > 50 && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) vol = 50;

      const success = queue.node.setVolume(vol);
      await interaction.reply(`${success ? `ボリュームを${vol}%に設定しました。` : "なんかセットできませんでした。"}`);
    };

    if (interaction.command.name === "seek") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      const duration = interaction.options.getNumber("duration");

      await queue.node.seek(duration * 1000) ? await interaction.reply(`${duration}秒に移動したよ！`) : await interaction.reply({ content: "数字があたおかだったかも", ephemeral: true });
    };

    if (interaction.command.name === "userinfo") {
      const id = await interaction.options.getString("id");
      let userinfo;
      try {
        userinfo = await client.users.fetch(id);
      } catch (error) {
        return await interaction.reply({ content: "指定したIDはユーザーではありません。", ephemeral: true })
      };

      await interaction.reply({
        embeds: [{
          title: `${userinfo.tag}`,
          description: `**アイコン:** ${avatar}\n**プロフ:** <@${userinfo.id}>`,
          color: mutaocolor,
          thumbnail: { url: avatar_to_URL(userinfo) }
        }]
      });
    };

    if (interaction.command.name === "role") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      const targetuser = interaction.options.getMember("user");
      const targetrole = interaction.options.get("role");
      if (interaction.options.getSubcommandGroup() === "user") {
        if (interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
          if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.reply("管理者権限所持者のみ実行可能です。");
          try {
            if (interaction.options.getSubcommand() === "add") {
              await targetuser.roles.add(targetrole.role);
              await interaction.reply(`${targetuser.displayName}に${targetrole.role.name}を付与したよ！`);
            };

            if (interaction.options.getSubcommand() === "remove") {
              await targetuser.roles.remove(targetrole.role);
              await interaction.reply(`${targetuser.displayName}から${targetrole.role.name}を強奪したよ！`);
            };
          } catch (error) {
            return await interaction.reply({ content: "順位的に操作できませんでした。", ephemeral: true });
          };
        } else {
          return await interaction.reply({ content: "ロールを管理できる権限が無いよ！", ephemeral: true });
        };

        if (interaction.options.getSubcommand() === "list") {
          const guildroles = interaction.guild.roles.cache.size
          if (targetuser.roles.highest.rawPosition === 0) {
            await interaction.reply("何も...無いじゃないか...ッ！！！");
          } else if (targetuser.roles.color === null && targetuser.roles.highest) {
            await interaction.reply({
              embeds: [{
                title: `${targetuser.user.tag}`,
                description: `**ロール数**: ${targetuser.roles.cache.size}\n**一番上のロール**: ${targetuser.roles.highest}\nID: ${targetuser.roles.highest.id}\n順番(上から): ${guildroles - targetuser.roles.highest.rawPosition}/${guildroles}`,
                color: `${targetuser.roles.highest.color}`,
                thumbnail: {
                  url: avatar_to_URL(targetuser.user)
                }
              }]
            });
          } else {
            await interaction.reply({
              embeds: [{
                title: `${targetuser.user.tag}`,
                description: `**ロール数**: ${targetuser.roles.cache.size}\n**名前の色になっているロール**: ${targetuser.roles.color}\nID: ${targetuser.roles.color.id}\nカラーコード: ${targetuser.roles.color.hexColor}\n順番(上から): ${guildroles - targetuser.roles.color.rawPosition}/${guildroles}\n**一番上のロール**: ${targetuser.roles.highest}\nID: ${targetuser.roles.highest.id}\n順番(上から): ${guildroles - targetuser.roles.highest.rawPosition}/${guildroles}`,
                color: targetuser.roles.color.color,
                thumbnail: {
                  url: targetuser.user.avatar ? `https://cdn.discordapp.com/avatars/${targetuser.user.id}/${targetuser.user.avatar}.png?size=4096` : `${targetuser.user.defaultAvatarURL}?size=4096`
                }
              }]
            });
          }
        }
      };

      if (interaction.options.getSubcommandGroup() === "all") {
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return await interaction.reply({ content: "ロールを管理できる権限が無いよ！", ephemeral: true });
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply("管理者権限所持者のみ実行可能です。");
        const ignore = interaction.options.getBoolean("ignorebot");
        let members;
        if (ignore) {
          let i = 0;
          (await interaction.guild.members.fetch()).map(async member => {
            if (!member.user.bot) i += 1;
          });
          members = i;
        } else {
          members = interaction.guild.memberCount;
        };
        try {
          const add = interaction.options.getSubcommand() === "add";
          await interaction.reply(add ? `${targetrole.role.name}を${members}人に付与中` : `${targetrole.role.name}を${members}人から奪取中`);
          await Promise.all((await interaction.guild.members.fetch()).map(async member => {
            if (ignore && member.user.bot) return;
            const has = member.roles.cache.get(targetrole.role.id);
            if ((add && has) || (!add && !has)) return;
            add ? await member.roles.add(targetrole.role) : await member.roles.remove(targetrole.role);
          }));
          const content = add ? `${targetrole.role.name}を${members}人に付与したよ！` : `${targetrole.role.name}を${members}人から奪取したよ！`;
          await interaction.editReply(content).catch(async e => await interaction.channel.send(content).catch(e => { return; }));
          await interaction.user.send(add ? `ロールの付与が完了しました。` : `ロールの剥奪が完了しました。`).catch(e => { return; });
        } catch (error) {
          await interaction.reply(`エラー\n${error}`).catch(async e => await interaction.channel.send(`エラー\n${error}`));
          console.log(error);
        };
      };

      if (interaction.options.getSubcommandGroup() === "allbot") {
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return await interaction.reply({ content: "ロールを管理できる権限が無いよ！", ephemeral: true });
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply("管理者権限所持者のみ実行可能です。");

        let i = 0;
        (await interaction.guild.members.fetch()).map(async member => {
          if (member.user.bot) i += 1;
        });
        members = i;

        try {
          const add = interaction.options.getSubcommand() === "add";
          await interaction.reply(add ? `${targetrole.role.name}を${members}人に付与中` : `${targetrole.role.name}を${members}人から奪取中`);
          await Promise.all((await interaction.guild.members.fetch()).map(async member => {
            if (!member.user.bot) return;
            const has = member.roles.cache.get(targetrole.role.id);
            if ((add && has) || (!add && !has)) return;
            add ? await member.roles.add(targetrole.role) : await member.roles.remove(targetrole.role);
          }));
          const content = add ? `${targetrole.role.name}を${members}人に付与したよ！` : `${targetrole.role.name}を${members}人から奪取したよ！`;
          await interaction.editReply(content).catch(async e => await interaction.channel.send(content).catch(e => { return; }));
          await interaction.user.send(add ? `ロールの付与が完了しました。` : `ロールの剥奪が完了しました。`).catch(e => { return; });
        } catch (error) {
          await interaction.reply(`エラー\n${error}`).catch(async e => await interaction.channel.send(`エラー\n${error}`));
          console.log(error);
        }
      };
    };

    if (interaction.command.name === "send") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でしか実行できません！", ephemeral: true });
      try {
        const description = interaction.options.getString("description");
        const channel = interaction.options.getChannel("channel");
        if (!interaction.options.getBoolean("embed")) {
          const attachmentimage = interaction.options.getAttachment("attachmentimage");
          const urlimage = interaction.options.getString("urlimage");
          const image = attachmentimage ? attachmentimage.url : urlimage;
          let content = {};
          content.content = description;
          if (image !== null && (image.startsWith("http://") || image.startsWith("https://"))) {
            content.files = [];
            content.files.push(image);
          };
          return await (await interaction.guild.channels.fetch(channel.id)).send(content);
        };
        let embed = {
          embeds: [
            {
              description: description
            }
          ]
        };
        const title = interaction.options.getString("title");
        if (title !== null) embed.embeds[0].title = title;
        const url = interaction.options.getString("url");
        if (url !== null) embed.embeds[0].url = url;
        const attachmentimage = interaction.options.getAttachment("attachmentimage");
        const urlimage = interaction.options.getString("urlimage");
        const image = attachmentimage ? attachmentimage.url : urlimage;
        if (image !== null && (image.startsWith("http://") || image.startsWith("https://"))) embed.embeds[0].image = { url: image };
        const attachmentthumbnail = interaction.options.getAttachment("attachmentthumbnail");
        const urlthumbnail = interaction.options.getString("urlthumbnail");
        const thumbnail = attachmentthumbnail ? attachmentthumbnail.url : urlthumbnail;
        if (thumbnail !== null && (thumbnail.startsWith("http://") || thumbnail.startsWith("https://"))) embed.embeds[0].thumbnail = { url: thumbnail };
        const authortext = interaction.options.getString("authortext");
        const authorurl = interaction.options.getString("authorurl");
        const attachmentauthorimage = interaction.options.getAttachment("attachmentauthorimage");
        const urlauthorimage = interaction.options.getString("urlauthorimage");
        if (authortext !== null || authorurl !== null || attachmentauthorimage !== null || urlauthorimage !== null) embed.embeds[0].author = {};
        if (authortext !== null) embed.embeds[0].author.name = authortext;
        if (authorurl !== null) embed.embeds[0].author.url = authorurl;
        const authorimage = attachmentauthorimage ? attachmentauthorimage.url : urlauthorimage;
        if (authorimage !== null && (authorimage.startsWith("http://") || authorimage.startsWith("https://"))) embed.embeds[0].author.icon_url = authorimage;
        const footertext = interaction.options.getString("footertext");
        const attachmentfooterimage = interaction.options.getAttachment("attachmentfooterimage");
        const urlfooterimage = interaction.options.getString("urlfooterimage");
        if (footertext !== null || attachmentfooterimage !== null || urlfooterimage !== null) embed.embeds[0].footer = {};
        if (footertext !== null) embed.embeds[0].footer.text = footertext;
        const footerimage = attachmentfooterimage ? attachmentfooterimage.url : urlfooterimage;
        if (footerimage !== null && (footerimage.startsWith("http://") || footerimage.startsWith("https://"))) embed.embeds[0].footer.icon_url = footerimage;
        const rgbcolor = interaction.options.getInteger("color");
        const hexcolor = interaction.options.getString("hexcolor");
        if (rgbcolor !== null || hexcolor !== null) {
          if (hexcolor === null || (hexcolor !== null && rgbcolor !== null)) embed.embeds[0].color = rgbcolor;
          if (rgbcolor === null) {
            const color = parseInt(hexcolor, 16);
            if (!color) return await interaction.reply({ content: `カラーコード${hexcolor}は16進数である必要があります。`, ephemeral: true });
            if (color > 16777215) return await interaction.reply({ content: `変換後のカラーコード(${color})が16777215を超えているため適応できません。`, ephemeral: true });
            embed.embeds[0].color = color;
          };
        };

        (await (await interaction.guild.channels.fetch(channel.id)).send(embed));
      } catch (error) {
        return await interaction.reply({ content: `権限的か開発者のミスかそういう仕様で送信できませんでした。\n${error}`, ephemeral: true });
      };
      await interaction.reply("送信できました！");
    };

    if (interaction.command.name === "siranami") {
      await interaction.reply("https://www.youtube.com/@ShiranamIroriCH");
    };

    if (interaction.command.name === "ggrks") {
      await interaction.reply("https://google.com");
    };

    if (interaction.command.name === "getthumbnail") {
      const url = interaction.options.getString("url");
      const track = await discordplayer.search(url, {
        searchEngine: QueryType.AUTO
      });
      if (!track.hasTracks()) return await interaction.reply({ content: "処理できません。", ephemeral: true });
      await interaction.reply({
        embeds: [
          {
            title: "画像URL",
            image: {
              url: track.tracks[0].thumbnail
            },
            url: track.tracks[0].thumbnail,
            color: mutaocolor
          }
        ]
      }).catch(async e => {
        await interaction.reply({ content: `送信できません\n${e}` });
      });
    };

    if (interaction.command.name === "trans") {
      await interaction.deferReply();
      const sourcetext = interaction.options.getString("sourcetext");
      const outlang = interaction.options.getString("outlang");

      const result = await translate({
        free_api: true,
        text: sourcetext,
        target_lang: outlang,
        auth_key: API_KEY
      });

      if (result.status !== 200) return await interaction.reply(`${result.status}\n${result.statusText}`);
      const translated = result.data.translations[0];
      if (translated.text.length > 4096) return await interaction.followUp("翻訳結果が4096文字より長かったため送信できません。");

      await interaction.followUp({
        embeds: [{
          title: `${translated.detected_source_language} → ${outlang}`,
          description: `${translated.text}`,
          color: mutaocolor
        }]
      });
    };

    if (interaction.command.name === "today") {
      const dt = new Date();
      const y = dt.getFullYear();
      const m = dt.getMonth();
      const d = dt.getDate();
      const hour = ("00" + (dt.getHours())).slice(-2);
      const min = ("00" + (dt.getMinutes())).slice(-2);
      const sec = ("00" + (dt.getSeconds())).slice(-2);
      const msec = dt.getMilliseconds();
      const weekItems = ["日", "月", "火", "水", "木", "金", "土"];
      const dayOfWeek = weekItems[dt.getDay()];
      const wareki = dt.toLocaleDateString("ja-JP-u-ca-japanese", { year: "numeric" });
      const mprog = Math.floor(dt.getDate() / (new Date(y, (m + 1), 0).getDate()) * 100);
      const drem = (new Date(y, (m + 1), 0).getDate()) - dt.getDate();
      const dprog = Math.floor((dt.getTime() - (new Date(y, m, d).getTime())) / (24 * 60 * 60 * 1000) * 100);
      const mrem = Math.floor(((new Date(y, m, d + 1).getTime()) - dt.getTime()) / 1000 / 60);
      const yprog = Math.floor((dt.getTime() - (Date.parse(`${y - 1}/12/31`))) / (365 * 24 * 60 * 60 * 1000) * 100);
      const dyrem = Math.floor((Date.parse(`${y}/12/31`) - dt.getTime()) / 1000 / 60 / 60 / 24);
      await interaction.reply(`${y}年(${wareki})${("00" + (m + 1)).slice(-2)}月${("00" + (d)).slice(-2)}日(${dayOfWeek}) ${hour}時${min}分${sec}秒${msec}\n今日の進行度: ${dprog}%(残り${mrem}分)\n今月の進行度: ${mprog}%(残り${drem}日)\n今年の進行度: ${yprog}%(残り${dyrem}日)`);
    };

    if (interaction.command.name === "searchimage") {
      const image = interaction.options.getAttachment("image");
      const url = await interaction.options.getString("url");
      if (!image && !url) return await interaction.reply({ content: "画像かURLを指定して下さい。", ephemeral: true });
      if (image && url) return await interaction.reply({ content: "どちらか一方のみを指定して下さい", ephemeral: true });
      const imageurl = image ? image.url : url;
      const apiurl = `https://api.irucabot.com/imgcheck/check_url?url=${imageurl}`;
      await interaction.deferReply();

      const result = await (await fetch.fetch(apiurl, { method: "GET" })).json();
      if (result.status === "error") return await interaction.followUp(`${result.code}\n${result.message_ja}`);
      let description;
      let color;
      if (!result.found) {
        description = `画像はヒットしませんでした。`;
        color = redcolor;
      } else {
        description = `[${result.count}個の画像がヒットしました。](${result.resulturl})`;
        color = mutaocolor;
      };
      await interaction.followUp({
        embeds: [
          {
            description: description,
            color: color,
            thumbnail: {
              url: imageurl
            }
          }
        ]
      });
    };

    if (interaction.command.name === "avatar") {
      const id = interaction.options.getString("id");
      const member = interaction.options.getUser("member");
      if (!id && !member) return await interaction.reply({ content: "どちらかを指定してね", ephemeral: true });
      if (id && member) return await interaction.reply({ content: "どちらか一方を指定してね", ephemeral: true });
      let user;
      try {
        user = id ? await client.users.fetch(id) : member;
      } catch (error) {
        return await interaction.reply({ content: "ユーザーのIDを指定して下さい", ephemeral: true })
      }
      const avatar = avatar_to_URL(user);

      await interaction.reply({
        embeds: [
          {
            title: "画像URL",
            url: avatar,
            image: {
              url: avatar
            },
            color: mutaocolor
          }
        ]
      });
    };

    if (interaction.command.name === "startactivity") {
      if (!interaction.guild) return await interaction.reply("サーバー内で実行して下さい");
      if (!interaction.member.voice.channel) return await interaction.reply({ content: "VCに入ってから実行して下さい", ephemeral: true });
      const game = interaction.options.getString("activity");

      discordTogether.createTogetherCode(interaction.member.voice.channel.id, game).then(async invite => {
        if (invite.code === "50035") return await interaction.reply({ content: "存在しないアクティビティです", ephemeral: true });
        return await interaction.reply(invite.code);
      });
    };

    if (interaction.command.name === "saveemoji") {
      let emoji = interaction.options.getString("emojiid");
      let type = interaction.options.get("type");
      if (!Number(emoji)) return await interaction.reply(String(emoji).replace("<", "").replace(">", "").replace(":", ""));

      if (type === null || type.value === "png") type = "png";
      if (type.value === "gif") type = "gif";
      const url = `https://cdn.discordapp.com/emojis/${emoji}.${type}?size=4096`;
      await interaction.reply({
        embeds: [
          {
            description: `[絵文字画像のURL](${url})`,
            image: {
              url: url
            },
            color: mutaocolor
          }
        ]
      });
    };

    if (interaction.command.name === "messages") {
      const json = JSON.parse(fs.readFileSync("guilds.json"));
      const guild = json.find(guild => guild.id === interaction.guild.id);
      if (!guild) {
        json.push(
          {
            id: interaction.guild.id,
            send_count_channel: null,
            countswitch: false,
            count: 0
          }
        );
        fs.writeFileSync("guilds.json", Buffer.from(JSON.stringify(json)));
        await interaction.reply({ content: "データが新規に作成されました。\nカウントを開始するには/setchannelをして下さい。", ephemeral: true });
        return;
      };

      await interaction.reply({
        embeds: [
          {
            author: {
              name: interaction.guild.name,
              icon_url: interaction.guild.iconURL({extension: "png", size: 4096})
            },
            description: `メッセージ数: ${guild.count}${guild.countswitch ? "" : "\n現在カウントが停止されています。"}`,
            color: 3066993
          }
        ]
      });
    };

    if (interaction.command.name === "disconall") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: "管理者権限所持者のみ実行できます", ephemeral: true });
      const vc = interaction.options.getChannel("vc");
      if (vc === null && interaction.member.voice.channel) return await interaction.reply({ content: "VCを指定するかVCに入室して下さい。", ephemeral: true });
      if (vc === null) vc = interaction.member.voice.channel;
      if (!vc.members) return await interaction.reply({ content: "指定先のVCには誰もいません。", ephemeral: true });
      const memberssize = vc.members.size;
      await interaction.deferReply();
      try {
        await vc.members.map(async m => await m.voice.disconnect());
      } catch (error) {
        return await interaction.followUp("権限が変更されました。");
      };
      await interaction.followUp(`${memberssize}人を切断しました。`);
    };

    if (interaction.command.name === "banner") {
      const type = interaction.options.getBoolean("gif") ? "gif" : "png";
      let id = interaction.options.getString("id");
      const member = interaction.options.getUser("member");
      if (id === null && !member) id = interaction.user.id;
      if (member) id = member.id;
      const result = await (await fetch.fetch(`https://discord.com/api/users/${id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bot ${process.env.DISCORD_TOKEN}`
        },
        json: true
      })).json();
      if (result.user_id) return await interaction.reply({ content: `ユーザーが見つかりませんでした。`, ephemeral: true })
      if (!result.banner && !result.banner_color) return await interaction.reply({ content: "バナー画像も色も取得できませんでした。", ephemeral: true });
      const url = result.banner ? `https://cdn.discordapp.com/banners/${id}/${result.banner}.${type}?size=4096` : null;
      const description = result.banner ? `[バナーの画像URL](${url})` : `バナーの色コード: ${result.banner_color}`;
      const color = result.banner_color ? result.accent_color : 0;
      await interaction.reply({
        embeds: [
          {
            description: description,
            image: {
              url: url
            },
            color: color
          }
        ]
      });
    };

    if (interaction.command.name === "getroleicon") {
      const role = interaction.options.getRole("role");
      if (!role.iconURL()) return await interaction.reply({ content: "指定されたロールにアイコンはありませんでした。", ephemeral: true });
      const url = `https://cdn.discordapp.com/role-icons/${role.id}/${role.icon}.png?size=4096`;
      await interaction.reply({
        embeds: [
          {
            description: `[アイコンの画像URL](${url})`,
            image: { url: url },
            color: role.color ? role.color : 0
          }
        ]
      });
    };

    if (interaction.command.name === "deafall") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: "管理者権限所持者のみ実行できます。", ephemeral: true });
      let vc = interaction.options.getChannel("vc");
      vc = vc ? vc : interaction.member.voice.channel;
      if (!vc) return await interaction.reply({ content: "vcに参加するか指定して下さい。", ephemeral: true });
      if (!vc.members) return await interaction.reply({ content: "指定先のvcには誰もいません", ephemeral: true });
      let cancel = interaction.options.getBoolean("cancel");
      cancel = cancel ? false : true;
      const membersize = vc.members.size;
      await interaction.deferReply();
      try {
        await vc.members.map(async m => await m.voice.setDeaf(cancel));
      } catch (error) {
        return await interaction.followUp("権限的に無理でした。");
      };
      await interaction.followUp(cancel ? `${membersize}人をスピーカーミュートしました。` : `${membersize}人のスピーカーミュートを解除しました。`);
    };

    if (interaction.command.name === "setchannel") {
      await interaction.deferReply();
      const channel = interaction.options.getChannel("channel");
      let json = JSON.parse(fs.readFileSync("guilds.json"));
      if (!json.find(guild => guild.id === interaction.guild.id)) {
        json.push(
          {
            id: interaction.guild.id,
            send_count_channel: channel.id,
            countswitch: true,
            count: 0
          }
        );
        fs.writeFileSync("guilds.json", Buffer.from(JSON.stringify(json)));
        await interaction.followUp(`カウント数送信先チャンネルを設定しました。\n<#${channel.id}>`);
        return;
      };
      json.find(guild => guild.id === interaction.guild.id).send_count_channel = channel.id
      json.find(guild => guild.id === interaction.guild.id).countswitch = true;
      fs.writeFileSync("guilds.json", Buffer.from(JSON.stringify(json)));
      await interaction.followUp(`カウント数送信先チャンネルを設定しました。\n<#${channel.id}>`);
    };

    if (interaction.command.name === "stopcount") {
      let json = JSON.parse(fs.readFileSync("guilds.json"));
      const guild = json.find(guild => guild.id === interaction.guild.id);
      if (!guild) {
        writedefault(interaction.guild.id);
        await interaction.reply({ content: "データが新規に作成されました。カウントはデフォルトで無効です。\n/setchannelで有効化します。", ephemeral: true });
        return;
      };
      json.find(guild => guild.id === interaction.guild.id).countswitch = false
      fs.writeFileSync("guilds.json", Buffer.from(JSON.stringify(json)));
      await interaction.reply("カウントをストップしました。");
    };

    if (interaction.command.name === "delmessages") {
      if (!interaction.guild) return await interaction.reply({ content: "サーバー内でしか実行できません！", ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: "管理者権限所持者のみ実行できます。", ephemeral: true });

      const channel = interaction.options.getChannel("channel");

      const me = interaction.guild.members.me;
      if (!me.permissions.has(PermissionFlagsBits.ManageMessages) || !me.permissionsIn(channel.id).has(PermissionFlagsBits.ManageMessages)) return await interaction.reply({ content: "メッセージを管理する権限がありません！", ephemeral: true });

      const num = interaction.options.getInteger("number");

      await interaction.reply(`<#${channel.id}>内の${num}個のメッセージを削除しています...。`);
      const fetchreply = await interaction.fetchReply();

      await Promise.all((await channel.messages.fetch({ limit: num })).map(async message => {
        if (fetchreply.id === message.id) return;
        await message.delete();
      })).catch(async e => { return await interaction.channel.send("権限が変更されました。").catch(async e => { return await interaction.user.send("権限が変更されたか、チャンネルが削除されました。").catch(async e => { return; }); }); });

      const finish = `<#${channel.id}>内の${num}個のメッセージを削除しました。`;
      interaction.editReply(finish).catch(async e => interaction.channel.send(finish).catch(async e => { return; }));
      interaction.user.send(finish).catch(async e => { return; });
    };

    if (interaction.command.name === "deeplusage") {
      const result = await (await fetch.fetch("https://api-free.deepl.com/v2/usage", {
        method: "GET",
        headers: {
          "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
        }
      })).json();
      await interaction.reply({embeds: [
        {
          description: `**今月の翻訳文字数:** ${result.character_count}文字\n**残り:** ${result.character_limit - result.character_count}文字`,
          color: mutaocolor
        }
      ]});
    };

    if (interaction.command.name === "scantext") {
      return await interaction.reply("実装中です。");
      const attachment = interaction.options.getAttachment("attachment");
      const optionurl = interaction.options.getString("url");
      if (attachment !== null && optionurl !== null) return await interaction.reply({ content: "1つだけ選んで下さい！", ephemeral: true });
      if (attachment === null && optionurl === null) return await interaction.reply({ content: "1つは選んで下さい！", ephemeral: true });
      const url = attachment ? attachment.url : optionurl;

      const [result] = await vision.textDetection(url);
      console.log(result.textAnnotations);
    };

    if (interaction.command.name === "test") {
      if (interaction.user.id !== "606093171151208448") return await interaction.reply("管理者及び開発者のみ実行可能です。");

      const trash = await ping.promise.probe("存在しないIPなのさ、HAHA！");
      console.log(trash);
    };
  } catch (e) {
    console.log(e);
    if (interaction.user.id !== "606093171151208448") {
      await client.users.cache.get("606093171151208448").send(`${interaction.guild ? `${interaction.guild.name}の${interaction.user.tag}` : interaction.user.tag}\nがデバッガーになってくれたお知らせ\n${e}`);
      const error = e;
      const errormsg = `頑張って解読してね(管理者のコードミスの可能性の方が高いです)\n${error}`;
      await interaction.reply(errormsg).catch(async e => await interaction.channel.send(errormsg).catch(async e => await interaction.user.send(errormsg).catch(e => { return; })));
    } else {
      await interaction.user.send(`おめえエラー起こしてんじゃねえよ\n${e}`);
    };
  };
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.system || !message.guild) return;
  try {
    let json = JSON.parse((fs.readFileSync("guilds.json")));
    let guild = json.find(guild => guild.id === message.guild.id);
    if (!guild) {
      writedefault(message.guild.id);
      return;
    };

    if (guild.countswitch) {
      const count = json.find(guild => guild.id === message.guild.id).count;
      json.find(guild => guild.id === message.guild.id).count = count + 1;
      fs.writeFileSync("guilds.json", Buffer.from(JSON.stringify(json)));
    };
  } catch (e) {
    console.log(e);
  };
});

discordplayer.events.on("error", (error) => {
  if (error.message.match("The operation was aborted")) return;
  console.log(error);
});

// client.on("messageReactionAdd", async (reaction, user) => { // https://discord.gg/M9MmS6k2jT
//   console.log(reaction);
//   if (reaction.message.id !== "1099317662854697091") return;
//   if (reaction.emoji.name !== "✅") return;
//   const member = reaction.message.guild.members.resolve(user);
//   member.roles.add("1099312160284352512");
// });

// client.on("messageReactionRemove", async (reaction, user) => {
//   console.log(reaction);
//   if (reaction.message.id !== "1099317662854697091") return;
//   if (reaction.emoji.name !== "✅") return;
//   const member = reaction.message.guild.members.resolve(user);
//   member.roles.remove("1099312160284352512");
// });

client.login(process.env.DISCORD_TOKEN).catch(e => console.log(e));