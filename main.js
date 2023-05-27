require("dotenv").config();
const { Client, GatewayIntentBits, PermissionFlagsBits, DiscordAPIError, ChannelType, ApplicationCommandOptionType } = require("discord.js");
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
client.once("ready", async () => {
  setInterval(async () => {
    const result = await ping.promise.probe("8.8.8.8");
    client.user.setActivity({ name: `${discordplayer.queues.cache.size} / ${client.guilds.cache.size} servers・${client.users.cache.size} users・${result.time}ms` });
  }, 60000);

  // const guilds = JSON.parse(fs.readFileSync("guilds.json"));
  // client.guilds.cache.map(g => {
  //   if (!guilds.find(guild => guild === g)) guilds.
  // })

  cron.schedule("59 59 23 * * *", () => {
    const data = Number(fs.readFileSync("yutasaba.txt"));
    const dt = new Date();
    const date = `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
    client.guilds.cache.get("1074670271312711740").channels.cache.get("1078954468353249380").send({
      embeds: [{
        author: {
          name: client.guilds.cache.get("610020293208965151").name,
          icon_url: client.guilds.cache.get("610020293208965151").iconURL()
        },
        description: `メッセージ数: ${data}`,
        color: 3066993,
        footer: {
          text: `日付: ${date}`
        }
      }]
    });
    fs.writeFileSync("yutasaba.txt", "0");
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
    { // yutamaruattack
      name: "yutamaruattack",
      description: "アタックゆた"
    },
    { // yutahistory
      name: "yutashistory",
      description: "歴史"
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
    { // memberinfo
      name: "memberinfo",
      description: "サーバー内のメンバーの情報を取得する",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "member",
          description: "メンバー"
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
    { // join
      name: "join",
      description: "読み上げを開始する"
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
    { // partyactivate
      name: "partyactivate",
      description: "HAPPY BIRTHDAY"
    }
  ];
  await client.application.commands.set(data);
  console.log(`${client.user.tag} 準備完了`);
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isCommand()) {
      return;
    };

    const adminicon = client.users.fetch("606093171151208448").then(user => `${user.avatarURL()}?size=4096`);
    const adminname = client.users.fetch("606093171151208448").then(user => user.tag);

    if (interaction.commandName === "help") {
      const result = await ping.promise.probe("8.8.8.8");
      await interaction.reply({
        embeds: [{
          description: "サポート鯖: https://discord.gg/ky97Uqu3YY\n**注意点**\n・音楽再生中にVCを移動させるとキューが消えます。仕様です。\n・/songhistoryの合計時間は/skipすると現実時間よりも長い時間になります。\n・/setvolumeについて...実行した人が管理者権限を持っているか否かに基づいて制限が取っ払われます\n・デバッグが行き届いていない箇所が多いためじゃんじゃん想定外の事をして下さい。",
          color: 16748800,
          footer: {
            icon_url: `${adminicon}`,
            text: `Made by ${adminname}・${result.time}ms`
          }
        }]
      });
    };

    if (interaction.commandName === "ping") {
      const result = await ping.promise.probe("8.8.8.8");
      let message = `**Websocket:** ${client.ws.ping}ms\n**API Endpoint:** please wait...\n**ping 8.8.8.8:** ${result.time}ms`
      await interaction.reply(message);
      const msg = await interaction.fetchReply();
      message = message.replace("please wait...", `${msg.createdTimestamp - interaction.createdTimestamp}ms`);
      await interaction.editReply(message);
    };

    if (interaction.commandName === "play") {
      if (interaction.guild === null) return await interaction.reply({ content: "サーバー内でないと実行できません！", ephemeral: true });
      if (interaction.guild.members.me.voice.channel === null && interaction.member.voice.channel === null) return await interaction.reply({ content: "playコマンド\nvcに入れ", ephemeral: true });
      if (interaction.guild.members.me.voice.channel === null) { // undefined回避
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Connect) && !interaction.guild.members.me.permissionsIn(interaction.member.voice.channel.id).has(PermissionFlagsBits.Connect)) return interaction.reply({ content: "VCに接続できる権限が無いよ！", ephemeral: true });
      };

      await interaction.deferReply(); // タイムアウト防止
      const url = await interaction.options.getString("url");
      let vc = await interaction.options.getChannel("vc");
      vc = vc ? vc : interaction.member.voice.channel;
      const volume = await interaction.options.getInteger("vol");
      let vol = volume ? volume : 30;
      if (vol > 50 && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) vol = 50;

      const track = await discordplayer.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO
      });
      if (!track.hasTracks()) return await interaction.followUp("何かしらの原因により処理できません。");
      // const streaming = track.tracks.map(track => { return track.durationMS === 0 });
      // if (!streaming) return await interaction.followUp("一時的なバグか何かによりライブ配信は再生できません。");

      const getqueue = useQueue(interaction.guild.id);
      const queuesize = url.match("http") ? (getqueue ? getqueue.size : 0) + track.tracks.length : (getqueue ? getqueue.size : 0) + 1;
      const queuenumber = getqueue ? `${getqueue.getSize() + 1}番目に追加｜キュー内合計: ${queuesize}曲` : "再生開始";
      let queue;

      // https://github.com/Androz2091/discord-player/issues/1705
      try {
        queue = await discordplayer.play(vc, track, {
          nodeOptions: {
            metadata: {
              channel: interaction.channel,
              client: interaction.guild.members.me,
              requestedBy: interaction.user
            },
            volume: vol,
            // onBeforeCreateStream: {
            //   async onBeforeCreateStream(track) {
            //     try {
            //       (await stream({ url: track.url })).stream
            //     } catch (error) {
            //       true;
            //     };
            //   }
            // }
          }
        });
      } catch (error) {
        return await interaction.followUp(`処理中にエラーが発生しました。\n${error}`);
      };

      let t; let description; let thumbnail;

      if (track.hasPlaylist()) {
        t = track.playlist;
        thumbnail = t.tracks[0].thumbnail;
        description = `**合計時間:** ${t.durationFormatted}\n**曲数:** ${t.tracks.length}曲`;
      } else {
        t = track.tracks[0];
        thumbnail = t.thumbnail;
        description = `**投稿者:** ${t.author}\n**長さ:** ${t.duration}`;
      };
      if (!url.match("http")) description = `${description}\n**検索ワード:** ${url.substring(0, 15)}${url.length > 15 ? "..." : ""}`;

      if (!getqueue) queue.queue.history.push(queue.queue.currentTrack);
      await interaction.followUp({
        embeds: [
          {
            title: t.title,
            description: description,
            thumbnail: { url: thumbnail },
            footer: { text: queuenumber },
            url: t.url,
            color: 16748800
          }
        ]
      });
    };

    if (interaction.commandName === "leave") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      await interaction.deferReply();

      queue.delete();
      await interaction.followUp("またね！");
      await wait(3); // そういう演出
      await interaction.deleteReply();
    };

    if (interaction.commandName === "pause") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      let paused = queue.node.pause();
      paused ? await interaction.reply("一時停止したよ") : await interaction.reply({ content: "既に一時停止中だよ！", ephemeral: true }); // deferReply/followUpをするとephemeralが使えないらしい
    };

    if (interaction.commandName === "unpause") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      let paused = queue.node.resume();
      paused ? await interaction.reply("一時停止を解除したよ") : await interaction.reply({ content: "一時停止がされてなかったよ", ephemeral: true });
    };

    if (interaction.commandName === "clear") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      if (queue.tracks.data.length === 0) return await interaction.reply({ content: "キューの中は既に再生中の曲だけだよ！", ephemeral: true });
      const losttracks = queue.tracks.data.length - 1;

      await interaction.deferReply(); // 100万曲追加する輩がいるかもしれないのでタイムアウト防止
      queue.tracks.clear();
      // do {
      //   queue.tracks.remove();
      // } while (queue.tracks.data.length !== 0); // clear()だと/playで追加すると再生中の曲が途切れてうんともすんとも言わなくなるので対策として
      await interaction.followUp(`${losttracks}曲がダイソンの手によってまっさらになったよ`);
    };

    if (interaction.commandName === "queue") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      let page = interaction.options.getInteger("page");
      if (page === null) { page = 1; };
      const maxpages = (Math.floor(queue.tracks.size / 10)) + 1;
      if (page > maxpages) return await interaction.reply({ content: "ページ数があたおか", ephemeral: true }); // あたおかな数字入れられたらエラー吐くかもしれないので念のため

      await interaction.deferReply(); // タイムアウト防止

      const pageStart = 10 * (page - 1); // 埋め込み作り☆
      const pageEnd = pageStart + 10;
      const tracks = queue.tracks.toArray().slice(pageStart, pageEnd).map((m, i) => { // ですくりぷしょん
        return `**${i + pageStart + 1}.** (${m.duration === "0:00" ? "ライブ" : m.duration}) [${m.title.length <= 20 ? m.title : `${m.title.substring(0, 20)}...`}](${m.url})`
      });

      let queuelength;
      const length = (queue.estimatedDuration + (queue.currentTrack.durationMS - queue.node.streamTime)) / 1000; // 再生中の曲の長さが含まれてないから足す
      if (length === 0) {
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
          description: `**再生中:** (${streamtime}) [${queue.currentTrack.title.length <= 20 ? queue.currentTrack.title : `${queue.currentTrack.title.substring(0, 20)}...`}](${queue.currentTrack.url})\n\n${tracks.join("\n")}${queue.tracks.data.length > pageEnd ? `\n**...**\n**他:** ${queue.tracks.data.length - pageEnd}曲` : ``}`, // 表示したキューの後にいくつかの曲があったらその曲数を表示
          thumbnail: {
            url: queue.currentTrack.thumbnail
          },
          color: 16748800,
          footer: {
            text: `ページ: ${page}/${maxpages}`
          }
        }]
      });
    };

    if (interaction.commandName === "skip") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let number = interaction.options.getInteger("number");
      if (number !== null && number < 1 || number > queue.tracks.data.length) return await interaction.reply({ content: "指定した数字があたおか", ephemeral: true });
      await interaction.deferReply();

      let t;
      if (queue.repeatMode === 3 && !queue.tracks.data[0]) {
        queue.node.skip();
        await wait(5);

        t = queue.currentTrack;
      } else if (!queue.tracks.data[0]) {
        await interaction.followUp("キューが空になったよ！またね！");
        await wait(1); // そういう演出
        queue.delete();
        await wait(2);
        await interaction.deleteReply();
        return;
      } else if (number !== null) {
        number = number - 1;
        t = queue.tracks.data[number];
        queue.node.skipTo(number);
      } else {
        t = queue.tracks.data[0];
        queue.node.skip();
      };

      let embed = {
        embeds: [
          {
            description: `**再生開始:** [${t.title.substring(0, 20)}${t.title.length > 20 ? "..." : ""}](${t.url}) (${t.duration})`,
            color: 16748800,
            thumbnail: { url: t.thumbnail }
          }
        ]
      };
      if (queue.tracks.data.length !== 0) embed.embeds[0].title = `**残り:** ${queue.durationFormatted} / ${queue.tracks.data.length}曲`;
      if (number !== null) embed.embeds[0].description = `${embed.embeds[0].description}\n${number + 1}曲スキップしました。`;
      await interaction.followUp(embed);
    };

    if (interaction.commandName === "nowp" || interaction.commandName === "songinfo") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let num = interaction.options.getInteger("number");
      if (num < 0 || num > queue.tracks.data.length) return await interaction.reply({ content: "数字があたおか", ephemeral: true });
      const vol = queue.node.volume;

      let t; let time;
      if (interaction.commandName === "nowp" || num === 0 || num === null) {
        t = queue.currentTrack;
        const progress = queue.node.createProgressBar(); // 埋め込み作り(discordplayer神)
        if (queue.node.getTimestamp().progress === Infinity) {
          time = "**ライブ配信**";
        } else {
          time = `\n\n**${progress}**`
        };
      } else {
        num = num - 1;
        t = queue.tracks.data[num];
        time = `\n**長さ:** ${t.duration}`;
      };

      await interaction.reply({
        embeds: [
          {
            title: t.title,
            url: t.url,
            thumbnail: { url: t.thumbnail },
            description: `**投稿者:** ${t.author}\n**リクエスト:** ${t.requestedBy.username}${time}`,
            color: 16748800,
            footer: { text: `今までに${queue.history.getSize()}曲再生しました。｜ボリューム: ${vol}%` }
          }
        ]
      });
    };

    if (interaction.commandName === "loop") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
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
        sendmode = "リピートをautoplayに設定したよ！";
      } else if (mode.value === QueueRepeatMode.OFF) {
        sendmode = "リピートを解除したよ！";
      };
      await interaction.reply(sendmode);
    };

    if (interaction.commandName === "remove") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      const number = (interaction.options.getInteger("number"));

      if (number <= 0 || number > queue.tracks.data.length) return await interaction.reply({ content: "指定した番号の曲は存在しません。", ephemeral: true });

      await interaction.deferReply();
      await interaction.followUp(`**${number}.** ${queue.tracks.data[number - 1].title}を削除したよ！`);
      queue.tracks.removeOne(queue.tracks.data[number - 1]);
    };

    if (interaction.commandName === "songhistory") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let page = interaction.options.getInteger("page");
      if (page === null) { page = 1 };
      if (page < 1 || page > ((Math.floor(queue.history.tracks.data.length / 10)) + 1)) return await interaction.reply({ content: "ページ数があたおか", ephemeral: true });
      if (queue.history.tracks.data.length === 0) return await interaction.reply({ content: "履歴はまだ保存されていません", ephemeral: true });

      await interaction.deferReply();
      const pageEnd = (-10 * (page - 1)) - 1;
      const pageStart = (pageEnd - 10);
      const tracks = queue.history.tracks.data.slice(pageStart, pageEnd).reverse().map((m, i) => {
        return `**${i + (pageEnd * -1)}.** (${m.duration === "0:00" ? "ライブ" : m.duration}) [${m.title.substring(0, 20)}${m.title.length > 20 ? "..." : ""}](${m.url})`;
      });

      let trackslength
      if (queue.history.tracks.data.length === 1) {
        trackslength = queue.node.streamTime;
      } else {
        const length = queue.history.tracks.data.slice(0, queue.history.tracks.data.length - 1).map((m) => {
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
            description: `**再生中:** (${queue.node.getTimestamp().progress === Infinity ? "ライブ" : `${queue.node.getTimestamp().current.label}/${queue.currentTrack.duration}`}) [${queue.currentTrack.title.substring(0, 20)}${queue.currentTrack.title.length > 20 ? "..." : ""}](${queue.currentTrack.url})\n\n${tracks.join("\n")}${queue.history.tracks.data.length > (pageStart * -1) ? `\n**...**\n**他:** ${queue.history.tracks.data.length + pageStart}曲` : ""}`,
            color: 16748800,
            thumbnail: {
              url: queue.currentTrack.thumbnail
            },
            footer: {
              text: `ページ: ${page}/${(Math.floor(queue.history.tracks.data.length / 10)) + 1}`
            }
          }
        ]
      });
    };

    if (interaction.commandName === "shuffle") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      if (queue.tracks.data.length === 1) return await interaction.reply({ content: "キュー内は1曲しか無いよ！", ephemeral: true });

      await interaction.deferReply();
      queue.tracks.shuffle();
      await interaction.followUp(`${queue.tracks.data.length}曲をシャッフルしました。`);
    };

    if (interaction.commandName === "setvolume") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let vol = interaction.options.getInteger("vol");
      if (vol > 50 && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) vol = 50;

      const success = queue.node.setVolume(vol);
      await interaction.reply(`${success ? `ボリュームを${vol}%に設定しました。` : "なんかセットできませんでした。"}`);
    };

    if (interaction.commandName === "seek") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = useQueue(interaction.guild.id);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      const duration = interaction.options.getNumber("duration");

      await queue.node.seek(duration * 1000) ? await interaction.reply(`${duration}秒に移動したよ！`) : await interaction.reply({ content: "数字があたおかだったかも", ephemeral: true });
    };

    if (interaction.commandName === "userinfo") {
      const id = await interaction.options.getString("id");
      const userinfo = await client.users.fetch(id).catch(async e => await interaction.reply({ content: "指定したIDはユーザーではありません。", ephemeral: true }));
      if (userinfo.interaction) return;
      const avatar = `${userinfo.avatar ? `https://cdn.discordapp.com/avatars/${userinfo.id}/${userinfo.avatar}.png` : userinfo.defaultAvatarURL}?size=4096`;

      await interaction.reply({
        embeds: [{
          title: `${userinfo.tag}`,
          description: `**アイコン:** ${avatar}\n**プロフ:** <@${userinfo.id}>`,
          color: 16748800,
          thumbnail: { url: avatar }
        }]
      });
    };

    if (interaction.commandName === "role") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const targetuser = interaction.options.getMember("user");
      const targetrole = interaction.options.get("role");
      if (interaction.options.getSubcommandGroup() === "user") {
        if (interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
          if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.reply("管理者権限所持者のみ実行可能です。");
          if (interaction.options.getSubcommand() === "add") {
            targetuser.roles.add(targetrole.role).catch(async e => { return await interaction.reply({ content: "順位的に操作できませんでした。", ephemeral: true }) });
            await interaction.reply(`${targetuser.displayName}に${targetrole.role.name}を付与したよ！`);
          };

          if (interaction.options.getSubcommand() === "remove") {
            targetuser.roles.remove(targetrole.role).catch(async e => { return await interaction.reply({ content: "順位的に操作できませんでした。", ephemeral: true }) });
            await interaction.reply(`${targetuser.displayName}から${targetrole.role.name}を強奪したよ！`);
          };
        } else {
          return interaction.reply({ content: "ロールを管理できる権限が無いよ！", ephemeral: true });
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
                color: `${targetuser.roles.highest.color}`
              }]
            });
          } else {
            await interaction.reply({
              embeds: [{
                title: `${targetuser.user.tag}`,
                description: `**ロール数**: ${targetuser.roles.cache.size}\n**名前の色になっているロール**: ${targetuser.roles.color}\nID: ${targetuser.roles.color.id}\nカラーコード: ${targetuser.roles.color.hexColor}\n順番(上から): ${guildroles - targetuser.roles.color.rawPosition}/${guildroles}\n**一番上のロール**: ${targetuser.roles.highest}\nID: ${targetuser.roles.highest.id}\n順番(上から): ${guildroles - targetuser.roles.highest.rawPosition}/${guildroles}`,
                color: targetuser.roles.color.color
              }]
            });
          }
        }
      };

      if (interaction.options.getSubcommandGroup() === "all") {
        if (interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
          if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.reply("管理者権限所持者のみ実行可能です。");
          if (interaction.options.getSubcommand() === "add") {
            const guildmembers = await interaction.guild.members.fetch();
            await interaction.reply(`${targetrole.role.name}を${interaction.guild.memberCount}人に付与中`);
            await Promise.all(guildmembers.map(member => member.roles.add(targetrole.role))).catch(async e => await interaction.editReply("権限が変更されました。").catch(async e => await interaction.channel.send("権限が変更されました。").catch(async e => await interaction.user.send("権限が変更されました。").catch(e => { return; }))));
            await interaction.editReply(`${targetrole.role.name}を${interaction.guild.memberCount}人に付与したよ！`).catch(async e => await interaction.channel.send(`${targetrole.role.name}を${interaction.guild.memberCount}人に付与したよ！`).catch(e => { return; }));
            await interaction.user.send(`ロールの付与が完了しました。`).catch(e => { return; });
          };

          if (interaction.options.getSubcommand() === "remove") {
            const guildmembers = await interaction.guild.members.fetch();
            interaction.reply(`${targetrole.role.name}を${interaction.guild.memberCount}人から奪取中`);
            await Promise.all(guildmembers.map(member => member.roles.remove(targetrole.role))).catch(async e => await interaction.editReply("権限が変更されました。").catch(async e => await interaction.channel.send("権限が変更されました。").catch(async e => await interaction.user.send("権限が変更されました。").catch(e => { return; }))));
            await interaction.editReply(`${targetrole.role.name}を${interaction.guild.memberCount}人から奪取したよ！`).catch(async e => await interaction.channel.send(`${targetrole.role.name}を${interaction.guild.memberCount}人から奪取したよ！`).catch(e => { return; }));
            await interaction.user.send(`ロールの剥奪が完了しました。`).catch(e => { return; });;
          };
        } else {
          return interaction.reply({ content: "ロールを管理できる権限が無いよ！", ephemeral: true });
        };
      };
    };

    if (interaction.commandName === "send") {
      const description = interaction.options.getString("description");
      if (!interaction.options.getBoolean("embed")) {
        const attachmentimage = interaction.options.getAttachment("attachmentimage");
        const urlimage = interaction.options.getString("urlimage");
        const image = attachmentimage ? attachmentimage.url : urlimage;
        let content = {};
        content.content = description;
        if (image !== null && image.startsWith("http")) {
          content.files = [];
          content.files.push(image);
        };
        return await interaction.reply(content);
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
      if (image !== null && image.startsWith("http")) embed.embeds[0].image = { url: image };
      const attachmentthumbnail = interaction.options.getAttachment("attachmentthumbnail");
      const urlthumbnail = interaction.options.getString("urlthumbnail");
      const thumbnail = attachmentthumbnail ? attachmentthumbnail.url : urlthumbnail;
      if (thumbnail !== null && thumbnail.startsWith("http")) embed.embeds[0].thumbnail = { url: thumbnail };
      const authortext = interaction.options.getString("authortext");
      const authorurl = interaction.options.getString("authorurl");
      const attachmentauthorimage = interaction.options.getAttachment("attachmentauthorimage");
      const urlauthorimage = interaction.options.getString("urlauthorimage");
      if (authortext !== null || authorurl !== null || attachmentauthorimage !== null || urlauthorimage !== null) embed.embeds[0].author = {};
      if (authortext !== null) embed.embeds[0].author.name = authortext;
      if (authorurl !== null) embed.embeds[0].author.url = authorurl;
      const authorimage = attachmentauthorimage ? attachmentauthorimage.url : urlauthorimage;
      if (authorimage !== null && authorimage.startsWith("http")) embed.embeds[0].author.icon_url = authorimage;
      const footertext = interaction.options.getString("footertext");
      const attachmentfooterimage = interaction.options.getAttachment("attachmentfooterimage");
      const urlfooterimage = interaction.options.getString("urlfooterimage");
      if (footertext !== null || attachmentfooterimage !== null || urlfooterimage !== null) embed.embeds[0].footer = {};
      if (footertext !== null) embed.embeds[0].footer.text = footertext;
      const footerimage = attachmentfooterimage ? attachmentfooterimage.url : urlfooterimage;
      if (footerimage !== null && footerimage.startsWith("http")) embed.embeds[0].footer.icon_url = footerimage;
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
      const channel = interaction.options.getChannel("channel");
      try {
        (await (await interaction.guild.channels.fetch(channel.id)).send(embed));
      } catch (error) {
        return await interaction.reply({ content: `権限的か開発者のミスで送信できませんでした。\n${error}`, ephemeral: true });
      };
      await interaction.reply("送信できました！");
    };

    if (interaction.commandName === "siranami") {
      await interaction.reply("https://www.youtube.com/@ShiranamIroriCH");
    };

    if (interaction.commandName === "yutamaruattack") {
      if (interaction.guildId !== "610020293208965151") return await interaction.reply("ゆた鯖でのみ実行可能です\ndiscord.gg/cpSp6kRXM5");
      await interaction.reply("多分できた");
      client.channels.cache.get("822410173850320916").send(`<@610018861319716866> Hey! ${interaction.member.displayName}がアタックしたよ！`);
    };

    if (interaction.commandName === "yutashistory") {
      if (interaction.guildId !== "610020293208965151") return await interaction.reply("ゆた鯖でのみ実行可能です\ndiscord.gg/cpSp6kRXM5");
      await interaction.reply("http://simp.ly/p/jNclcr")
    };

    if (interaction.commandName === "ggrks") {
      await interaction.reply("https://google.com");
    };

    if (interaction.commandName === "getthumbnail") {
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
            color: 16748800
          }
        ]
      }).catch(async e => {
        await interaction.reply({ content: `送信できません\n${e}` });
      });
    };

    if (interaction.commandName === "trans") {
      await interaction.deferReply();
      let outtext;
      const sourcetext = interaction.options.getString("sourcetext");
      const outlang = interaction.options.getString("outlang");

      return translate({
        free_api: true,
        text: sourcetext,
        target_lang: outlang,
        auth_key: API_KEY
      })
        .then(result => {
          outtext = result.data.translations[0].text;
          if (outtext.length > 4096) return interaction.followUp("翻訳結果が4096文字より長かったため送信できません。");
          interaction.followUp({
            embeds: [{
              title: `${result.data.translations[0].detected_source_language} → ${outlang}`,
              description: `${outtext}`,
              color: 16748800,
            }]
          });
        })
        .catch(error => {
          interaction.followUp(`エラー\n${error}`);
        });
    };

    if (interaction.commandName === "today") {
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

    if (interaction.commandName === "riseki") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames) || !interaction.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply("ニックネームを管理できる権限が無いよ！");
      let word = await interaction.options.getString("word");
      if (!word) { word = "離席"; };
      try {
        await interaction.member.setNickname(`${interaction.member.displayName} (${word})`);
        await interaction.reply({ content: `${word}に設定しました`, ephemeral: true });
      } catch (e) {
        await interaction.reply({ content: "君の権限高すぎるよ！", ephemeral: true });
      };
    };

    if (interaction.commandName === "memberinfo") {
      const member = interaction.options.getMember("member");
      if (!member) return await interaction.reply({ content: "例外のエラーが発生しました。", ephemeral: true });
      const createdat = `${member.user.createdAt.getFullYear()}年${member.user.createdAt.getMonth()}月${member.user.createdAt.getDate()}日${member.user.createdAt.getHours()}時${member.user.createdAt.getMinutes()}分${member.user.createdAt.getSeconds()}秒`;
      const joinedat = `${member.joinedAt.getFullYear()}年${member.joinedAt.getMonth()}月${member.joinedAt.getDate()}日${member.joinedAt.getHours()}時${member.joinedAt.getMinutes()}分${member.joinedAt.getSeconds()}秒`
      const avatar = member.user.avatarURL() ? member.user.avatarURL() : member.user.defaultAvatarURL;

      await interaction.reply({
        embeds: [{
          title: member.user.tag,
          description: `**アイコン:** ${avatar}?size=4096\n**アカウント作成:** ${createdat}\n**サーバー参加:** ${joinedat}\n`,
          color: 16748800,
          thumbnail: { url: `${avatar}?size=4096` },
        }]
      })
    };

    if (interaction.commandName === "searchimage") {
      const image = interaction.options.getAttachment("image");
      const url = await interaction.options.getString("url");
      if (!image && !url) return await interaction.reply({ content: "画像かURLを指定して下さい。", ephemeral: true });
      if (image && url) return await interaction.reply({ content: "どちらか一方のみを指定して下さい", ephemeral: true });
      const imageurl = image ? image.url : url;
      const apiurl = `https://api.irucabot.com/imgcheck/check_url?url=${imageurl}`;
      await interaction.deferReply();

      const result = await (await fetch.fetch(apiurl)).json();
      if (result.status === "error") return await interaction.followUp(`${result.code}\n${result.message_ja}`);
      let description;
      let color;
      if (!result.found) {
        description = `画像はヒットしませんでした。`;
        color = 15158332;
      } else {
        description = `[${result.count}個の画像がヒットしました。](${result.resulturl})`;
        color = 16748800;
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

    if (interaction.commandName === "avatar") {
      const id = interaction.options.getString("id");
      const member = interaction.options.getUser("member");
      if (!id && !member) return await interaction.reply({ content: "どちらかを指定してね", ephemeral: true });
      if (id && member) return await interaction.reply({ content: "どちらか一方を指定してね", ephemeral: true });
      const user = id ? await client.users.fetch(id).catch(async e => { return await interaction.reply({ content: "ユーザーのIDを指定して下さい", ephemeral: true }) }) : member;
      if (user.interaction) return;
      const avatar = `${user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : user.defaultAvatarURL}?size=4096`;

      await interaction.reply({
        embeds: [
          {
            title: "画像URL",
            url: avatar,
            image: {
              url: avatar
            },
            color: 16748800
          }
        ]
      });
    };

    if (interaction.commandName === "startactivity") {
      if (!interaction.guild) return await interaction.reply("サーバー内で実行して下さい");
      if (!interaction.member.voice.channel) return await interaction.reply({ content: "VCに入ってから実行して下さい", ephemeral: true });
      const game = interaction.options.getString("activity");

      discordTogether.createTogetherCode(interaction.member.voice.channel.id, game).then(async invite => {
        if (invite.code === "50035") return await interaction.reply({ content: "存在しないアクティビティです", ephemeral: true });
        return await interaction.reply(invite.code);
      });
    };

    if (interaction.commandName === "saveemoji") {
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
            color: 16748800
          }
        ]
      });
    };

    if (interaction.commandName === "messages") {
      if (interaction.guild.id !== "1074670271312711740" && interaction.guild.id !== "610020293208965151") return await interaction.reply({ content: "ゆた鯖内でのみ実行できます\ndiscord.gg/cpSp6kRXM5", ephemeral: true });
      const data = Number(fs.readFileSync("yutasaba.txt"));
      const dt = new Date();
      const date = `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
      await interaction.reply({
        embeds: [{
          description: `メッセージ数: ${data}`,
          color: client.guilds.cache.get("610020293208965151").roles.cache.get("610481839978577931").color,
          author: {
            name: client.guilds.cache.get("610020293208965151").name,
            icon_url: client.guilds.cache.get("610020293208965151").iconURL()
          },
          footer: {
            text: date
          }
        }]
      });
    };

    if (interaction.commandName === "disconall") {
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

    if (interaction.commandName === "banner") {
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
      const color = result.banner_color ? result.accent_color : 000000;
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

    if (interaction.commandName === "getroleicon") {
      const role = interaction.options.getRole("role");
      if (!role.iconURL()) return await interaction.reply({ content: "指定されたロールにアイコンはありませんでした。", ephemeral: true });
      const url = `https://cdn.discordapp.com/role-icons/${role.id}/${role.icon}.png?size=4096`;
      await interaction.reply({
        embeds: [
          {
            description: `[アイコンの画像URL](${url})`,
            image: { url: url },
            color: role.color ? role.color : 000000
          }
        ]
      });
    };

    if (interaction.commandName === "deafall") {
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

    if (interaction.commandName === "partyactivate") {
      try {
        const party = client.party.activate("Happy birthday");
        await interaction.reply(party);  
      } catch (error) {
        await interaction.reply(`${error}`);
      };
    };

    if (interaction.commandName === "test") {
      if (interaction.user.id !== "606093171151208448") return await interaction.reply("管理者及び開発者のみ実行可能です。");
      let text1 = interaction.options.getString("text1");
      
      await interaction.user.send("てすとこんぷりーてっど！");
    };
  } catch (e) {
    if (e == DiscordAPIError[10008]) return;
    console.log(e);
    if (interaction.user.id !== "606093171151208448") {
      await client.users.cache.get("606093171151208448").send(`${interaction.guild ? `${interaction.guild.name}の${interaction.user.tag}` : interaction.user.tag}\nがデバッガーになってくれたお知らせ\n${e}`);
      const error = e;
      const errormsg = `頑張って解読してね(管理者のコードミスの可能性の方が高いです)\n${error}`
      await interaction.reply(errormsg).catch(async e => await interaction.channel.send(errormsg).catch(async e => await interaction.user.send(errormsg).catch(e => { return; })));
    } else {
      await interaction.user.send(`おめえエラー起こしてんじゃねえよ\n${e}`);
    };
  };
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || message.system || !message.guild) return;

  try {
    if (message.guild.id === "610020293208965151") {
      const data = Number(fs.readFileSync("yutasaba.txt"));
      const num = (data + 1);
      fs.writeFileSync("yutasaba.txt", String(num));
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