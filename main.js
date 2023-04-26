require("dotenv").config();
const { Client, GatewayIntentBits, PermissionFlagsBits, DiscordAPIError } = require("discord.js");
const translate = require("deepl");
const client = new Client({ intents: Object.values(GatewayIntentBits) });
const API_KEY = process.env.DEEPL_API_KEY;
const { QueryType, Player, QueueRepeatMode } = require("discord-player");
const discordplayer = new Player(client, {
  deafenOnJoin: true,
  lagMonitor: 1000,
  ytdlOptions: {
    filter: "audioonly",
    quality: "highestaudio",
    highWaterMark: 1 << 25
  }
});
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
          type: 3,
          name: "url",
          description: "URLもしくは検索",
          required: true
        },
        {
          type: 7,
          name: "vc",
          description: "再生先のVC"
        },
        {
          type: 4,
          name: "vol",
          description: "管理者無: 1~20%・有: 1~100% | デフォルト: 15%"
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
          type: 3,
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
          type: 2,
          name: "user",
          description: "特定のユーザーのロールを管理",
          options: [
            {
              // /role user add
              type: 1,
              name: "add",
              description: "追加",
              options: [
                {
                  type: 6,
                  name: "user",
                  description: "ユーザー",
                  required: true
                },
                {
                  type: 8,
                  name: "role",
                  description: "ロール",
                  required: true
                }
              ]
            },
            {
              type: 1,
              name: "remove",
              description: "削除",
              options: [
                {
                  type: 6,
                  name: "user",
                  description: "ユーザー",
                  required: true
                },
                {
                  type: 8,
                  name: "role",
                  description: "ロール",
                  required: true
                }
              ]
            },
            {
              type: 1,
              name: "list",
              description: "一覧",
              options: [
                {
                  type: 6,
                  name: "user",
                  description: "ユーザー",
                  required: true
                }
              ]
            }
          ]
        },
        {
          type: 2,
          name: "all",
          description: "全てのユーザーのロールを管理",
          options: [
            {
              type: 1,
              name: "add",
              description: "追加",
              options: [
                {
                  type: 8,
                  name: "role",
                  description: "ロール",
                  required: true
                }
              ]
            },
            {
              type: 1,
              name: "remove",
              description: "削除",
              options: [
                {
                  type: 8,
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
          type: 3,
          name: "text1",
          description: "色々1"
        },
        {
          type: 3,
          name: "text2",
          description: "色々2"
        },
        {
          type: 11,
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
          type: 3,
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
          type: 3,
          name: "sourcetext",
          description: "翻訳する文",
          required: true
        },
        {
          type: 3,
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
          type: 3,
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
          type: 4,
          name: "page",
          description: "ページ"
        }
      ]
    },
    { // skip
      name: "skip",
      description: "再生中の曲か指定した曲数スキップする",
      options: [
        {
          type: 4,
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
          type: 4,
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
          type: 4,
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
          type: 4,
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
          type: 3,
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
          type: 4,
          name: "number",
          description: "/queueの番号"
        }
      ]
    },
    { // setvolume
      name: "setvolume",
      description: "ボリュームを設定する",
      options: [
        {
          type: 4,
          name: "vol",
          description: "管理者無: 1~20%・有: 1~100% | デフォルト: 15%",
          required: true
        }
      ]
    },
    { // memberinfo
      name: "memberinfo",
      description: "サーバー内のメンバーの情報を取得する",
      options: [
        {
          type: 6,
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
          type: 11,
          name: "image",
          description: "画像",
        },
        {
          type: 3,
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
          type: 3,
          name: "id",
          description: "ID"
        },
        {
          type: 6,
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
          type: 3,
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
          type: 3,
          name: "emojiid",
          description: "絵文字のID(絵文字をそのまま入力すると分解した結果が返って来ます。)",
          required: true
        },
        {
          type: 3,
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
    { // leaveall
      name: "leaveall",
      description: "VC内にいる全員を退出させる"
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
          type: 3,
          name: "id",
          description: "ID"
        },
        {
          type: 6,
          name: "member",
          description: "メンバー"
        },
        {
          type: 5,
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
          type: 8,
          name: "role",
          description: "ロール",
          required: true
        }
      ]
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
          description: "**注意点**\n・音楽再生中にVCを移動させるとキューが消えます。仕様です。\n・/songhistoryの合計時間は/skipすると現実時間よりも長い時間になります。\n・デバッグが行き届いていない箇所が多いためじゃんじゃん想定外の事をして下さい。",
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
      let vol = volume ? volume : 15;
      if (vol < 1) vol = 1;
      if (vol > 20 && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) vol = 20;
      if (vol > 100) vol = 100;

      const track = await discordplayer.search(url, {
        requestedBy: interaction.user,
        searchEngine: QueryType.AUTO
      });
      if (!track.hasTracks()) return await interaction.followUp({ content: "何かしらの原因により処理できません。", ephemeral: true });

      const getqueue = discordplayer.queues.get(interaction.guild);
      const queuenumber = getqueue ? `${getqueue.getSize() + 1}番目に追加｜キュー内合計: ${getqueue.size + track.tracks.length}曲` : "再生開始";
      let queue;

      // https://github.com/Androz2091/discord-player/issues/1705
      try {
        queue = await discordplayer.play(vc, track, {
          nodeOptions: {
            metadata: {
              channel: vc,
              client: interaction.guild.members.me,
              requestedBy: interaction.user
            },
            volume: vol,
            onAfterCreateStream: {
              async onBeforeCreateStream(track) {
                try {
                  (await stream(track.url, { discordPlayerCompatibility: true })).stream;
                } catch (error) {
                  true;
                };
              }
            }
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
      const queue = discordplayer.queues.get(interaction.guild);
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
      const queue = discordplayer.queues.get(interaction.guild);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      let paused = queue.node.setPaused(true);
      paused ? await interaction.reply("一時停止したよ") : await interaction.reply({ content: "既に一時停止中だよ！", ephemeral: true }); // deferReply/followUpをするとephemeralが使えないらしい
    };

    if (interaction.commandName === "unpause") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = discordplayer.queues.get(interaction.guild);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      let paused = queue.node.setPaused(false);
      paused ? await interaction.reply("一時停止を解除したよ") : await interaction.reply({ content: "一時停止がされてなかったよ", ephemeral: true });
    };

    if (interaction.commandName === "clear") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = discordplayer.queues.get(interaction.guild);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      if (queue.tracks.data.length === 0) return await interaction.reply({ content: "キューの中は既に再生中の曲だけだよ！", ephemeral: true });
      const losttracks = queue.tracks.data.length - 1;

      await interaction.deferReply(); // 100万曲追加する輩がいるかもしれないのでタイムアウト防止
      do {
        queue.tracks.removeOne(0);
      } while (queue.tracks.data.length !== 0); // clear()だと/playで追加すると再生中の曲が途切れてうんともすんとも言わなくなるので対策として
      await interaction.followUp(`${losttracks}曲がダイソンの手によってまっさらになったよ`);
    };

    if (interaction.commandName === "queue") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      const queue = discordplayer.queues.get(interaction.guild);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });

      let page = interaction.options.getInteger("page");
      if (page === null) { page = 1; };
      const maxpages = (Math.floor(queue.tracks.data.length / 10)) + 1;
      if (page < 1 || page > maxpages) return await interaction.reply({ content: "ページ数があたおか", ephemeral: true }); // あたおかな数字入れられたらエラー吐くかもしれないので念のため

      await interaction.deferReply(); // タイムアウト防止

      const pageStart = 10 * (page - 1); // 埋め込み作り☆
      const pageEnd = pageStart + 10;
      const tracks = queue.tracks.data.slice(pageStart, pageEnd).map((m, i) => { // ですくりぷしょん
        return `**${i + pageStart + 1}.** (${m.duration === "0:00" ? "ライブ" : m.duration}) [${m.title.length <= 20 ? m.title : `${m.title.substring(0, 20)}...`}](${m.url})`
      });

      let queuelength;
      const length = (queue.node.queue.estimatedDuration + (queue.currentTrack.durationMS - queue.node.streamTime)) / 1000; // 再生中の曲の長さが含まれてないから足す
      if (length === 0) {
        queuelength = "ライブ配信のみ";
      } else {
        const hours = ("00" + Math.floor(length / 3600)).slice(-2)
        const minutes = ("00" + Math.floor((length % 3600) / 60)).slice(-2)
        const seconds = ("00" + Math.floor((length % 3600) % 60)).slice(-2)
        if (hours !== "00") {
          queuelength = `キュー内合計: ${hours}:${minutes}:${seconds}`;
        } else if (minutes !== "00") {
          queuelength = `キュー内合計: ${minutes}:${seconds}:`;
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
      const queue = discordplayer.queues.get(interaction.guild);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let number = interaction.options.getInteger("number");
      if (number !== null && number < 1 || number > queue.tracks.data.length) return await interaction.reply({ content: "指定した数字があたおか", ephemeral: true });
      await interaction.deferReply();

      let t; let description;
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
            description: `**再生開始:** [${t.title.substring(0, 20)}${t.title > 20 ? "..." : ""}](${t.url}) (${t.duration})`,
            color: 16748800,
            thumbnail: { url: t.thumbnail}
          }
        ]
      };
      if (queue.tracks.data.length !== 0) embed.embeds[0].title = `**残り:** ${queue.durationFormatted} / ${queue.tracks.data.length}曲`;
      if (number !== null) embed.embeds[0].description = `${embed.embeds[0].description}\n${number + 1}曲スキップしました。`;
      await interaction.followUp(embed);
    };

    if (interaction.commandName === "nowp" || interaction.commandName === "songinfo") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      queue = discordplayer.queues.get(interaction.guild);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let num = interaction.options.getInteger("number");
      if (num < 0 || num > queue.tracks.data.length) return await interaction.reply({ content: "数字があたおか", ephemeral: true });
      const vol = queue.node.volume;

      let embed;
      if (interaction.commandName === "nowp" || num === 0 || num === null) {
        await interaction.deferReply();
        const progress = queue.node.createProgressBar(); // 埋め込み作り(discordplayer神)
        const perc = queue.node.getTimestamp();
        let time;
        if (perc.progress === Infinity) {
          time = "ライブ配信";
        } else {
          time = progress
        };
        embed = {
          embeds: [{
            title: queue.currentTrack.title,
            url: queue.currentTrack.url.replace("https://www.youtube.com/watch?v=", "https://youtu.be/"),
            thumbnail: {
              url: queue.currentTrack.thumbnail
            },
            description: `**投稿者:** ${queue.currentTrack.author}\n**リクエスト:** ${queue.currentTrack.requestedBy.username}\n\n**${time}**`,
            color: 16748800,
            footer: {
              text: `今までに${queue.history.size}曲再生しました。｜ボリューム: ${vol}%`
            }
          }]
        };
      } else {
        await interaction.deferReply();
        num = num - 1;

        let time;
        if (queue.tracks.data[num].durationMS === 0) {
          time = "ライブ中";
        } else {
          const length = queue.tracks.data[num].durationMS / 1000;
          const hours = Math.floor(length / 3600);
          const minutes = Math.floor(((length % 3600)) / 60);
          const seconds = Math.floor((length % 3600) % 60);
          if (hours != 0) {
            time = `${hours}時間${minutes}分${seconds}秒`;
          } else if (minutes != 0) {
            time = `${minutes}分${seconds}秒`;
          } else {
            time = `${seconds}秒`;
          };
        };

        embed = {
          embeds: [{
            title: queue.tracks.data[num].title,
            url: queue.tracks.data[num].url.replace("https://www.youtube.com/watch?v=", "https://youtu.be/"),
            thumbnail: {
              url: queue.tracks.data[num].thumbnail
            },
            description: `**投稿者:** ${queue.tracks.data[num].author}\n**リクエスト:** ${queue.tracks.data[num].requestedBy.username}\n**長さ:**${time}`,
            color: 16748800,
            footer: {
              text: `今までに${queue.history.size}曲再生しました。｜ボリューム: ${vol}%`
            }
          }]
        };
      };

      await interaction.followUp(embed);
    };

    if (interaction.commandName === "loop") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      queue = discordplayer.queues.get(interaction.guild);
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
      queue = discordplayer.queues.get(interaction.guild);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      const number = (interaction.options.getInteger("number"));

      if (number <= 0 || number > queue.tracks.data.length) return await interaction.reply({ content: "指定した番号の曲は存在しません。", ephemeral: true });

      await interaction.deferReply();
      await interaction.followUp(`**${number}.** ${queue.tracks.data[number - 1].title}を削除したよ！`);
      queue.tracks.removeOne(number - 1);
    };

    if (interaction.commandName === "songhistory") {
      if (interaction.guild === null) return await interaction.reply("サーバー内でないと実行できません！");
      queue = discordplayer.queues.get(interaction.guild);
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
        let title;
        if (m.title.length <= 20) {
          title = m.title;
        } else {
          title = `${m.title.substring(0, 20)}...`;
        };
        let duration;
        if (m.duration === "0:00") {
          duration = "ライブ";
        } else {
          duration = m.duration;
        };
        return `**${i + (pageEnd * -1)}.** (${duration}) [${title}](${m.url.replace("https://www.youtube.com/watch?v=", "https://youtu.be/")})`;
      });

      let currenttitle; // 再生中のタイトル
      if (queue.currentTrack.title.length <= 20) {
        currenttitle = queue.currentTrack.title
      } else {
        currenttitle = `${queue.currentTrack.title.substring(0, 20)}...`
      };
      let streamtime; // 埋め込みの文章
      if (queue.currentTrack.durationMS === 0) {
        streamtime = `(ライブ)`;
      } else {
        const length = (queue.node.streamTime / 1000);
        const minutes = Math.floor(length / 60);
        const minutesamari = length % 60;
        let seconds = Math.floor(minutesamari);
        if (seconds.toString().length === 1) seconds = `0${seconds}`;
        streamtime = `${minutes}:${seconds}/${queue.currentTrack.duration}`;
      };

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

      const hours = Math.floor(trackslength / 3600);
      const hoursamari = trackslength % 3600;
      const minutes = Math.floor(hoursamari / 60);
      const minutesamari = hoursamari % 60;
      const seconds = Math.floor(minutesamari);
      if (hours != 0) {
        trackslength = `${hours}時間${minutes}分${seconds}秒`
      } else if (minutes != 0) {
        trackslength = `${minutes}分${seconds}秒`
      } else {
        trackslength = `${seconds}秒`
      };
      if (trackslength === "0秒") {
        trackslength = "ライブ";
      };

      await interaction.followUp({
        embeds: [
          {
            title: `今までに${queue.history.tracks.data.length}曲 / ${trackslength}再生したよ！`,
            description: `**再生中:** (${streamtime}) [${currenttitle}](${queue.currentTrack.url})\n\n${tracks.join("\n")}${queue.history.tracks.data.length > (pageStart * -1) ? `\n**...**\n**他:** ${queue.history.tracks.data.length + pageStart}曲` : ``}`,
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
      queue = discordplayer.queues.get(interaction.guild);
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
      queue = discordplayer.queues.get(interaction.guild);
      if (!queue && interaction.guild.members.me.voice.channel !== null) return await interaction.reply({ content: "多分再起動したのでplayをするかvcから蹴るかして下さいな。", ephemeral: true });
      if (!queue) return await interaction.reply({ content: "VCに入ってないよ！", ephemeral: true, });
      if (!queue.currentTrack) return await interaction.reply({ content: "再生中の曲が無いよ！", ephemeral: true });
      let vol = interaction.options.getInteger("vol");
      if (vol < 1) vol = 1;
      if (vol > 20 && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) vol = 20;
      if (vol > 100) vol = 100;

      const success = queue.node.setVolume(vol);
      await interaction.reply(`${success ? `ボリュームを${vol}%に設定しました。` : "なんかセットできませんでした。"}`);
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
          try {
            if (interaction.options.getSubcommand() === "add") {
              targetuser.roles.add(targetrole.role);
              await interaction.reply(`${targetuser.displayName}に${targetrole.role.name}を付与したよ！`);
            };

            if (interaction.options.getSubcommand() === "remove") {
              targetuser.roles.remove(targetrole.role);
              await interaction.reply(`${targetuser.displayName}から${targetrole.role.name}を強奪したよ！`);
            };
          } catch (e) {
            await interaction.reply({ content: "権限順位的に操作できませんでした。", ephemeral: true });
          };
        } else {
          return interaction.reply({content: "ロールを管理できる権限が無いよ！", ephemeral: true});
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
      let title = interaction.options.getString("title")
      let url = interaction.options.getString("url")
      let description = interaction.options.getString("description")
      let color = interaction.options.getString("color")
      let thumbnail = interaction.options.getString("thumbnail")

      const onoff = interaction.options.get("embedonoff")
      if (onoff.value === "true") {
        if (!description) return await interaction.reply("説明文はゼッタイ");
        await interaction.reply({
          embeds: [{
            title: `${title}`,
            url: `${url}`,
            description: `${description}`,
            color: `${color}`,
            thumbnail: {
              url: `${thumbnail}`
            },
            image: {
              url: `${url}`
            },
          }]
        });
      } else if (onoff.value === "false") {
        await interaction.reply(`${description}`);
      }
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
      console.log(member);
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

    if (interaction.commandName === "leaveall") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: "管理者権限所持者のみ実行できます", ephemeral: true });
      if (interaction.member.voice.channel === null) return await interaction.reply({ content: "VCに入室してからコマンドを実行して下さい", ephemeral: true });
      await interaction.deferReply();
      const membersize = interaction.member.voice.members.size;
      Promise.all(interaction.member.voice.members.map(m => m.voice.disconnect())).catch(async e => await interaction.followUp("権限が変更されました。"));
      await interaction.followUp(`${membersize}人を切断しました。`);
    };

    if (interaction.commandName === "join") {
      await interaction.reply({ content: "まだ未実装です。", ephemeral: true });
      // const vc = interaction.member.voice.channel;
      // if (vc === null) return await interaction.reply({ content: "vcに入室して下さい", ephemeral: true });
      // const data = JSON.parse(fs.readFileSync("yomiage.json"));
      // const result = data.push({
      //   vc: vc,
      //   channel: interaction.channel
      // });
      // fs.writeFileSync("yomiage.json", JSON.stringify(result));
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
      if (result.user_id) return await interaction.reply({content: `ユーザーが見つかりませんでした。`, ephemeral: true})
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
    }

    if (interaction.commandName === "test") {
      if (interaction.user.id !== "606093171151208448") return await interaction.reply("管理者及び開発者のみ実行可能です。");
      let text1 = interaction.options.getString("text1");
      const result = await fetch.fetch(`https://discord.com/api/users/${text1}`, {
        method: "GET",
        headers: {
          "Authorization": `Bot ${process.env.DISCORD_TOKEN}`
        },
        json: true
      });
      console.log(await result.json());
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
    if (message.channel.id === "1078856959878508596" && !message.content.startsWith("=")) {
      await message.channel.send("使えないよ！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！");
      // async function chat() {
      //   let msg = await message.channel.send("生成中");
      //   let id = String(fs.readFileSync("chatgpt.txt"));
      //   id = id ? id : undefined;
      //   const { ChatGPTAPI } = await import("chatgpt");
      //   const chatgpt = new ChatGPTAPI({
      //     apiKey: `${process.env.OPENAI_API_KEY}`,
      //     // completionParams: {model: "gpt-4"}
      //   });
      //   const res = await chatgpt.sendMessage(message.content, {
      //     parentMessageId: id
      //   }).catch(async e => {
      //     const error = e;
      //     return await msg.edit(`エラー\n${error}`).catch(async e => { return await message.channel.send(`エラー\n${error}`) });
      //   });
      //   await msg.edit(res.text).catch(async e => await message.channel.send(res.text));
      //   fs.writeFileSync("chatgpt.txt", res.id);
      // };
      // chat();
    };
  } catch (e) {
    const error = e;
    console.log(error);
    client.users.cache.get("606093171151208448").send(`メッセージの方のエラー\n${error}`);
    await message.channel.send(`エラー\n${error}`).catch(async e => await message.author.send(`エラー\n${error}`).catch(e => { return; }));
  };

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

discordplayer.on("error", (error) => {
  if (error.message.match("The operation was aborted")) return;
  console.log(error);
  return;
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