/* eslint-disable array-callback-return */
import { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType, ApplicationCommandOptionType, EmbedBuilder, Events } from 'discord.js'
import { config } from 'dotenv'
import translate from 'deepl'
import { QueryType, Player, QueueRepeatMode, useQueue } from 'discord-player'
import { fetch } from 'undici'
import { DiscordTogether } from 'discord-together'
import ping from 'ping'
import fs from 'fs'
import cron from 'node-cron'
import crypto from 'crypto'
import { Logger } from 'tslog'

export const logger = new Logger({ hideLogPositionForProduction: true })
logger.info('loaded modules')
export const client = new Client({ intents: Object.values(GatewayIntentBits) })
export const discordTogether = new DiscordTogether(client)
export const discordplayer = Player.singleton(client)
discordplayer.extractors.loadDefault().then(result => {
  if (result.success) {
    logger.info('loaded discord-player extractors')
  } else {
    return logger.error(`${result.error.name}\n${result.error.message}\n${result.error.stack}`)
  };
})

config()

export const API_KEY = process.env.DEEPL_API_KEY
export const guildsData = 'data/guilds.json'
export const nicknameData = 'data/nickname.json'

export const mutaoColor = 16760703
export const redcolor = 16744319
export const greencolor = 9043849

export const ataokanumber = '指定した数字があたおか'
export const notHasManageRole = 'ロール管理の権限がありません。'
export const cannotManageRole = 'このロールは管理できません。'

/**
 * @param {Date} date
 * @returns
 */
export function today (date) {
  const dt = date || new Date()
  const y = dt.getFullYear()
  const m = dt.getMonth()
  const d = dt.getDate()
  const hour = ('00' + (dt.getHours())).slice(-2)
  const min = ('00' + (dt.getMinutes())).slice(-2)
  const sec = ('00' + (dt.getSeconds())).slice(-2)
  const msec = dt.getMilliseconds()
  const weekItems = ['日', '月', '火', '水', '木', '金', '土']
  const dayOfWeek = weekItems[dt.getDay()]
  const wareki = dt.toLocaleDateString('ja-JP-u-ca-japanese', { year: 'numeric' })

  return `${y}年(${wareki})${('00' + (m + 1)).slice(-2)}月${('00' + (d)).slice(-2)}日(${dayOfWeek}) ${hour}時${min}分${sec}秒${msec}`
}
/**
 *
 * @param {number} sec
 * @returns
 */
export function wait (sec) {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000)
  })
}
/**
 *
 * @param {string} id
 */
export function writedefault (id) {
  const json = JSON.parse(fs.readFileSync(guildsData))
  json.push(
    {
      id,
      send_count_channel: null,
      count: 0
    }
  )
  fs.writeFileSync(guildsData, Buffer.from(JSON.stringify(json)))
}
/**
 * @param {User} user
 * @returns
 */
export function avatarToURL (user) {
  if (user.avatarURL()) {
    return user.avatarURL({ size: 4096 })
  } else {
    return user.defaultAvatarURL
  };
}
/**
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns
 */
export function returnMusic (interaction) {
  const queue = useQueue(interaction.guild.id)
  if (!queue && interaction.guild.members.me.voice.channel) return '多分再起動したのでplayをするかvcから蹴るかして下さいな。'
  if (!queue) return 'VCに入ってないよ！'
  if (!queue.currentTrack) return '再生中の曲が無いよ！'
  return false
}
/**
 *
 * @param {number} length
 * @returns
 */
export function times (length) {
  const hours = ('00' + Math.floor(length / 3600)).slice(-2)
  const minutes = ('00' + Math.floor((length % 3600) / 60)).slice(-2)
  const seconds = ('00' + Math.floor((length % 3600) % 60)).slice(-2)
  if (hours !== '00') {
    return `${hours}:${minutes}:${seconds}`
  } else if (minutes !== '00') {
    return `${minutes}:${seconds}`
  } else {
    return `00:${seconds}`
  };
}
export async function googlePing () {
  return (await ping.promise.probe('8.8.8.8')).time
}
/**
 *
 * @param {import('discord.js').User} user
 * @param {import('discord.js').Role} role
 * @returns
 */
export function roleHas (user, role) {
  return user.roles.cache.has(role.id)
}
export async function managerole (user, or, role, interaction) {
  const has = user.roles.cache.has(role.id)
  if (or === 'add') {
    if (has) {
      await interaction.reply({ content: '既にロールが付いています。', ephemeral: true })
      return false
    };
    user.roles.add(role)
      .then(() => {
        return true
      })
      .catch(async _error => {
        await interaction.reply({ content: cannotManageRole })
        return false
      })
  } else {
    if (!has) {
      await interaction.reply({ content: '既にロールが外されています。', ephemeral: true })
      return false
    };
    user.roles.remove(role)
      .then(() => {
        return true
      })
      .catch(async _error => {
        await interaction.reply({ content: cannotManageRole })
        return false
      })
  }
}
export async function permissionHas (interaction, PermissionFlagsBits, String) {
  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits)) {
    await interaction.reply({ content: String, ephemeral: true })
    return false
  };
  return true
}
export async function isGuild (interaction) {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: 'サーバー内でのみ実行できます。', ephemeral: true })
    return false
  };
  return true
}
/**
 * @param {Client} client
 * @returns
 */
export async function admin (client) {
  return await client.users.fetch('606093171151208448')
}
export async function adminicon () {
  return avatarToURL(await admin())
}
export async function adminname () {
  return (await admin()).username
}

try {
  client.once(Events.ClientReady, async client => {
    setInterval(async () => {
      const result = await ping.promise.probe('8.8.8.8')
      client.user.setActivity({ name: `${discordplayer.queues.cache.size} / ${(await client.guilds.fetch()).size} servers・${client.users.cache.size} users・${result.time}ms` })
    }, 30000)

    cron.schedule('59 59 23 * * *', async () => {
      const dt = new Date()
      const date = `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`
      const json = JSON.parse(fs.readFileSync(guildsData))
      await Promise.all(json.map(async guild => {
        let fetchguild
        let fetchchannel
        if (!guild.send_count_channel) {
          json.find(jsonguild => jsonguild.id === guild.id).count = 0
          fs.writeFileSync(guildsData, Buffer.from(JSON.stringify(json)))
          return
        };
        try {
          fetchguild = await client.guilds.fetch(guild.id)
          fetchchannel = await fetchguild.channels.fetch(guild.send_count_channel)
        } catch (error) {
          return
        };
        try {
          await fetchchannel.send({
            embeds: [
              {
                author: {
                  name: fetchguild.name,
                  icon_url: fetchguild.iconURL({ extension: 'png', size: 4096 })
                },
                description: `メッセージ数: ${guild.count}`,
                color: mutaoColor,
                footer: {
                  text: `日付: ${date}`
                }
              }
            ]
          })
        } catch (error) {
          logger.info(today())
          logger.error(error)
        };
        json.find(jsonguild => jsonguild.id === guild.id).count = 0
        fs.writeFileSync(guildsData, Buffer.from(JSON.stringify(json)))
      }))
    })

    logger.info('cleaning nickname data...')
    const json = JSON.parse(fs.readFileSync(nicknameData))
    await Promise.all(json.map(guild => {
      client.guilds.fetch(guild.id)
        .then(async fetchguild => {
          await fetchguild.members.me.setNickname(guild.nickname)
        })
        .catch(_error => {

        })
    }))
    fs.writeFileSync(nicknameData, Buffer.from(JSON.stringify([])))
    logger.info('cleaned nickname data')

    logger.info('setting slash commands...')
    await client.application.commands.set([
      { // help
        name: 'help',
        description: '注意書き等'
      },
      { // ping
        name: 'ping',
        description: '遅延'
      },
      { // leave
        name: 'leave',
        description: 'キューを削除しVCから退出'
      },
      { // play
        name: 'play',
        description: 'URL先の音源を再生する(YouTube等)/検索も可',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'url',
            description: 'URLもしくは検索',
            required: true
          },
          {
            type: ApplicationCommandOptionType.Channel,
            name: 'vc',
            description: '再生先のVC',
            channelTypes: [ChannelType.GuildVoice]
          },
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'vol',
            description: '管理者無: 1~50%・有: 1~100% | デフォルト: 30%',
            minValue: 1,
            maxValue: 100
          }
        ]
      },
      { // pause
        name: 'pause',
        description: '再生中の音源を一時停止'
      },
      { // unpause
        name: 'unpause',
        description: '一時停止を解除'
      },
      { // userinfo
        name: 'userinfo',
        description: 'ユーザー情報を表示',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'id',
            description: 'ID',
            required: true
          }
        ]
      },
      { // role
        name: 'role',
        description: 'ロール管理',
        options: [
          {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'user',
            description: '1ユーザーを対象に',
            options: [
              {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'add',
                description: '付与',
                options: [
                  {
                    type: ApplicationCommandOptionType.User,
                    name: 'user',
                    description: '対象ユーザー',
                    required: true
                  },
                  {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role',
                    description: '付与するロール',
                    required: true
                  }
                ]
              },
              {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'remove',
                description: '剥奪',
                options: [
                  {
                    type: ApplicationCommandOptionType.User,
                    name: 'user',
                    description: '対象ユーザー',
                    required: true
                  },
                  {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role',
                    description: '剥奪するロール',
                    required: true
                  }
                ]
              },
              {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'list',
                description: 'ロール一覧',
                options: [
                  {
                    type: ApplicationCommandOptionType.User,
                    name: 'user',
                    description: '対象ユーザー',
                    required: true
                  }
                ]
              }
            ]
          },
          {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'all',
            description: '全ユーザーを対象に',
            options: [
              {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'add',
                description: '付与',
                options: [
                  {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role',
                    description: '付与するロール',
                    required: true
                  },
                  {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'ignorebot',
                    description: 'botを除外する'
                  }
                ]
              },
              {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'remove',
                description: '剥奪',
                options: [
                  {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role',
                    description: '剥奪するロール',
                    required: true
                  },
                  {
                    type: ApplicationCommandOptionType.Boolean,
                    name: 'ignorebot',
                    description: 'botを除外する'
                  }
                ]
              }
            ]
          },
          {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'bot',
            description: 'botを対象に',
            options: [
              {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'add',
                description: '付与',
                options: [
                  {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role',
                    description: '付与するロール',
                    required: true
                  }
                ]
              },
              {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'remove',
                description: '剥奪',
                options: [
                  {
                    type: ApplicationCommandOptionType.Role,
                    name: 'role',
                    description: '剥奪するロール',
                    required: true
                  }
                ]
              }
            ]
          }
        ]
      },
      { // clear
        name: 'clear',
        description: 'キューをVCから退出せずに削除する'
      },
      { // test
        name: 'test',
        description: 'おいフータオ！ピンポンしようぜ！',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'text1',
            description: '色々1'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'text2',
            description: '色々2'
          },
          {
            type: ApplicationCommandOptionType.Attachment,
            name: 'attachment',
            description: 'ファイル'
          }
        ]
      },
      { // siranami
        name: 'siranami',
        description: 'シラナミのチャンネルを表示'
      },
      { // ggrks
        name: 'ggrks',
        description: 'ggrks'
      },
      { // getthumbnail
        name: 'getthumbnail',
        description: '再生中の曲、もしくは指定した曲のサムネを取得',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'url',
            description: 'URL'
          }
        ]
      },
      { // transdeepl
        name: 'trans',
        description: 'DeepLで翻訳する',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'sourcetext',
            description: '翻訳する文',
            required: true
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'outlang',
            description: '翻訳先の言語',
            required: true,
            choices: [
              {
                name: 'JA',
                value: 'JA'
              },
              {
                name: 'EN-GB',
                value: 'EN-GB'
              },
              {
                name: 'EN-US',
                value: 'EN-US'
              },
              {
                name: 'ES',
                value: 'ES'
              },
              {
                name: 'BG',
                value: 'BG'
              },
              {
                name: 'CS',
                value: 'CS'
              },
              {
                name: 'DA',
                value: 'DA'
              },
              {
                name: 'DE',
                value: 'DE'
              },
              {
                name: 'EL',
                value: 'EL'
              },
              {
                name: 'ET',
                value: 'ET'
              },
              {
                name: 'FR',
                value: 'FR'
              },
              {
                name: 'ID',
                value: 'ID'
              },
              {
                name: 'IT',
                value: 'IT'
              },
              {
                name: 'LT',
                value: 'LT'
              },
              {
                name: 'LV',
                value: 'LV'
              },
              {
                name: 'PL',
                value: 'PL'
              },
              {
                name: 'PT-BR',
                value: 'PT-BR'
              },
              {
                name: 'PT-PT',
                value: 'PT-PT'
              },
              {
                name: 'RO',
                value: 'RO'
              },
              {
                name: 'RU',
                value: 'RU'
              },
              {
                name: 'SL',
                value: 'SL'
              },
              {
                name: 'SV',
                value: 'SV'
              },
              {
                name: 'TR',
                value: 'TR'
              },
              {
                name: 'UK',
                value: 'UK'
              },
              {
                name: 'ZH',
                value: 'ZH'
              }
            ]
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'sourcelang',
            description: '翻訳する文の言語',
            choices: [
              {
                name: 'JA',
                value: 'JA'
              },
              {
                name: 'EN',
                value: 'EN'
              },
              {
                name: 'ES',
                value: 'ES'
              },
              {
                name: 'BG',
                value: 'BG'
              },
              {
                name: 'CS',
                value: 'CS'
              },
              {
                name: 'DA',
                value: 'DA'
              },
              {
                name: 'DE',
                value: 'DE'
              },
              {
                name: 'EL',
                value: 'EL'
              },
              {
                name: 'ET',
                value: 'ET'
              },
              {
                name: 'FR',
                value: 'FR'
              },
              {
                name: 'ID',
                value: 'ID'
              },
              {
                name: 'IT',
                value: 'IT'
              },
              {
                name: 'LT',
                value: 'LT'
              },
              {
                name: 'LV',
                value: 'LV'
              },
              {
                name: 'NL',
                value: 'NL'
              },
              {
                name: 'PL',
                value: 'PL'
              },
              {
                name: 'PT',
                value: 'PT'
              },
              {
                name: 'RO',
                value: 'RO'
              },
              {
                name: 'RU',
                value: 'RU'
              },
              {
                name: 'SK',
                value: 'SK'
              },
              {
                name: 'SL',
                value: 'SL'
              },
              {
                name: 'SV',
                value: 'SV'
              },
              {
                name: 'TR',
                value: 'TR'
              },
              {
                name: 'UK',
                value: 'UK'
              },
              {
                name: 'ZH',
                value: 'ZH'
              }
            ]
          }
        ]
      },
      { // today
        name: 'today',
        description: '今日の日付を表示する。'
      },
      { // queue
        name: 'queue',
        description: 'キューを表示する',
        options: [
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'page',
            description: 'ページ',
            minValue: 1
          }
        ]
      },
      { // skip
        name: 'skip',
        description: '再生中の曲か指定した曲数スキップする',
        options: [
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'to',
            description: '/queueで表示された番号の曲へスキップ',
            minValue: 1
          }
        ]
      },
      { // nowp
        name: 'nowp',
        description: '再生中の曲の詳細を表示'
      },
      { // loop
        name: 'loop',
        description: '再生中の曲をループ',
        options: [
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'mode',
            description: 'track: 1曲だけ, queue: キューをループ, autoplay: おすすめの曲を勝手に追加し続ける(無限ループに陥りやすい), off: 解除',
            required: true,
            choices: [
              {
                name: 'track',
                value: QueueRepeatMode.TRACK
              },
              {
                name: 'queue',
                value: QueueRepeatMode.QUEUE
              },
              {
                name: 'autoplay',
                value: QueueRepeatMode.AUTOPLAY
              },
              {
                name: 'off',
                value: QueueRepeatMode.OFF
              }
            ]
          }
        ]
      },
      { // remove
        name: 'remove',
        description: '指定したキュー内の曲を削除する。',
        options: [
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'number',
            description: '/queueでタイトルの左に表示された番号',
            required: true,
            minValue: 1
          }
        ]
      },
      { // history
        name: 'songhistory',
        description: 'VCに接続した時から今までに追加した曲を表示する。',
        options: [
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'page',
            description: 'ページ',
            minValue: 1
          }
        ]
      },
      { // riseki
        name: 'riseki',
        description: 'ニックネームに「(離席)」を追加する',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'word',
            description: '括弧内の文字をカスタム'
          }
        ]
      },
      { // shuffle
        name: 'shuffle',
        description: 'キュー内をかき混ぜる'
      },
      { // songinfo
        name: 'songinfo',
        description: '指定した番号の曲の情報を表示する',
        options: [
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'number',
            description: '/queueの番号',
            minValue: 0
          }
        ]
      },
      { // setvolume
        name: 'setvolume',
        description: 'ボリュームを設定する',
        options: [
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'vol',
            description: '管理者無: 1~50%・有: 1~100% | デフォルト: 30%',
            minValue: 1,
            maxValue: 100,
            required: true
          }
        ]
      },
      { // searchimage
        name: 'searchimage',
        description: '画像検索',
        options: [
          {
            type: ApplicationCommandOptionType.Attachment,
            name: 'image',
            description: '画像'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'url',
            description: '画像のURL'
          }
        ]
      },
      { // avatar
        name: 'avatar',
        description: '指定したIDやメンバーのアイコンを取得する',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'id',
            description: 'ID'
          },
          {
            type: ApplicationCommandOptionType.User,
            name: 'member',
            description: 'メンバー'
          }
        ]
      },
      { // startactivity
        name: 'startactivity',
        description: 'アクティビティに入れるURLを生成する',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'activity',
            description: 'アクティビティの名前',
            choices: [
              {
                name: 'Watch Together',
                value: 'youtube'
              },
              {
                name: 'Poker Night',
                value: 'poker'
              },
              {
                name: 'Chess In The Park',
                value: 'chess'
              },
              {
                name: 'Checkers In The Park',
                value: 'checkers'
              },
              {
                name: 'Betrayal',
                value: 'betrayal'
              },
              {
                name: 'Fishing',
                value: 'fishing'
              },
              {
                name: 'Letter League',
                value: 'lettertile'
              },
              {
                name: 'Words snack',
                value: 'wordsnack'
              },
              {
                name: 'Doodle Crew',
                value: 'doodlecrew'
              },
              {
                name: 'SpellCast',
                value: 'spellcast'
              },
              {
                name: 'Awkword',
                value: 'awkword'
              },
              {
                name: 'Putt Party',
                value: 'puttparty'
              },
              {
                name: 'Sketch Heads',
                value: 'sketchheads'
              },
              {
                name: 'Blazing 8s',
                value: 'ocho'
              }
            ],
            required: true
          }
        ]
      },
      { // saveemoji
        name: 'saveemoji',
        description: '指定した絵文字を画像にする',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'emojiid',
            description: '絵文字のID(絵文字をそのまま入力すると分解した結果が返って来ます。)',
            required: true
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'type',
            description: '拡張子',
            choices: [
              {
                name: 'png',
                value: 'png'
              },
              {
                name: 'gif',
                value: 'gif'
              }
            ]
          }
        ]
      },
      { // disconall
        name: 'disconall',
        description: 'VC内にいる全員を退出させる',
        options: [
          {
            type: ApplicationCommandOptionType.Channel,
            name: 'vc',
            description: 'VC',
            channelTypes: [ChannelType.GuildVoice]
          }
        ]
      },
      { // messages
        name: 'messages',
        description: '0:00から今までにサーバー内で送信されたメッセの総数'
      },
      { // banner
        name: 'banner',
        description: 'バナーを保存する',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'id',
            description: 'ID'
          },
          {
            type: ApplicationCommandOptionType.User,
            name: 'member',
            description: 'メンバー'
          },
          {
            type: ApplicationCommandOptionType.Boolean,
            name: 'gif',
            description: 'gifの場合はTrueを選択'
          }
        ]
      },
      { // getroleicon
        name: 'getroleicon',
        description: 'ロールアイコンを取得する',
        options: [
          {
            type: ApplicationCommandOptionType.Role,
            name: 'role',
            description: 'ロール',
            required: true
          }
        ]
      },
      { // send
        name: 'send',
        description: '埋め込みを送る',
        options: [
          {
            type: ApplicationCommandOptionType.String,
            name: 'description',
            description: '説明文',
            required: true
          },
          {
            type: ApplicationCommandOptionType.Channel,
            name: 'channel',
            description: '送信先のチャンネル',
            channelTypes: [ChannelType.GuildText],
            required: true
          },
          {
            type: ApplicationCommandOptionType.Boolean,
            name: 'embed',
            description: '埋め込みか否か',
            required: true
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'title',
            description: 'タイトル'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'url',
            description: 'タイトル文字のURL'
          },
          {
            type: ApplicationCommandOptionType.Attachment,
            name: 'attachmentimage',
            description: '画像(アップ)'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'urlimage',
            description: '画像(URL)'
          },
          {
            type: ApplicationCommandOptionType.Attachment,
            name: 'attachmentthumbnail',
            description: 'サムネイル(アップ)'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'urlthumbnail',
            description: 'サムネイル(URL)'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'authortext',
            description: '一番上の小さい文字'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'authorurl',
            description: '一番上の小さい文字のURL'
          },
          {
            type: ApplicationCommandOptionType.Attachment,
            name: 'attachmentauthorimage',
            description: '一番上の小さい画像(アップ)'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'urlauthorimage',
            description: '一番上の小さい画像(URL)'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'footertext',
            description: '一番下の小さい文字'
          },
          {
            type: ApplicationCommandOptionType.Attachment,
            name: 'attachmentfooterimage',
            description: '一番下の小さい画像(アップ)'
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'urlfooterimage',
            description: '一番下の小さい画像(URL)'
          },
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'color',
            description: '10進数のカラーコード',
            maxValue: 16777215,
            minValue: 0
          },
          {
            type: ApplicationCommandOptionType.String,
            name: 'hexcolor',
            description: '16進数のカラーコード'
          }
        ]
      },
      { // deafall
        name: 'deafall',
        description: 'VC内の全員をサーバースピーカーミュートする',
        options: [
          {
            type: ApplicationCommandOptionType.Channel,
            name: 'vc',
            description: 'VC',
            channelTypes: [ChannelType.GuildVoice]
          },
          {
            type: ApplicationCommandOptionType.Boolean,
            name: 'cancel',
            description: 'ミュート解除'
          }
        ]
      },
      { // seek
        name: 'seek',
        description: 'シークバーをいじいじする',
        options: [
          {
            type: ApplicationCommandOptionType.Number,
            name: 'sec',
            description: '秒数',
            minValue: 0,
            required: true
          }
        ]
      },
      { // setchannel
        name: 'setchannel',
        description: '1日のカウント数を日本時間0時に送信するチャンネルを設定する。(送信後はカウントがリセットされます)',
        options: [
          {
            type: ApplicationCommandOptionType.Channel,
            name: 'channel',
            description: 'チャンネル',
            channelTypes: [ChannelType.GuildText],
            required: true
          }
        ]
      },
      { // stopsendcount
        name: 'stopsendcount',
        description: 'メッセージ数の定期送信を止める。(再有効化は/setchannelで)'
      },
      { // delmessages
        name: 'delmessages',
        description: '直前の指定した数のメッセージを全て削除する。',
        options: [
          {
            type: ApplicationCommandOptionType.Channel,
            name: 'channel',
            description: '削除するメッセージ達のチャンネル',
            required: true,
            channelTypes: [ChannelType.GuildText]
          },
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'number',
            description: '削除するメッセージ数(1~100)',
            required: true,
            minValue: 1,
            maxValue: 100
          }
        ]
      },
      { // deeplusage
        name: 'deeplusage',
        description: 'このBotのDeepLの使用状況を取得する。'
      },
      { // resetcount
        name: 'resetcount',
        description: 'メッセージカウントを無かったこと(ゼロ)にする。'
      },
      { // guildinfo
        name: 'guildinfo',
        description: 'サーバーの情報を取得する',
        options: [
          {
            type: ApplicationCommandOptionType.Boolean,
            name: 'icon',
            description: 'アイコンを取得する'
          }
        ]
      },
      { // password
        name: 'password',
        description: 'ランダムな文字を生成する',
        options: [
          {
            type: ApplicationCommandOptionType.Boolean,
            name: 'ephemeral',
            description: '他の人が見えないようにする'
          },
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'length',
            description: '文字数 | デフォルト: 8',
            minValue: 1,
            maxValue: 2000
          }
        ]
      },
      {
        name: 'setbitrate',
        description: '全てのチャンネルのビットレートを最大値か設定した数値にする',
        options: [
          {
            type: ApplicationCommandOptionType.Integer,
            name: 'bitrate',
            description: 'ビットレート(Kbps)',
            minValue: 8
          }
        ]
      }
    ])
    logger.info('set slash commands')

    await (await (await client.guilds.fetch('1099309562781245440')).channels.fetch('1146562994688503999')).send({
      embeds: [
        {
          title: 'MuTaoが起動しました。',
          color: greencolor,
          footer: { text: today() }
        }
      ]
    })
    logger.info(`${client.user.tag} all ready`)
  })

  client.on(Events.InteractionCreate, async interaction => {
    try {
      if (!interaction.isCommand()) return

      const admin = await client.users.fetch('606093171151208448')
      const adminicon = avatarToURL(admin)
      const adminname = admin.username
      const command = interaction.command.name
      const option = interaction.options
      const inguildCommands = [
        'role',
        'play',
        'leave',
        'pause',
        'unpause',
        'clear',
        'queue',
        'skip',
        'nowp',
        'songinfo',
        'loop',
        'remove',
        'songhistory',
        'shuffle',
        'setvolume',
        'seek',
        'role',
        'startactivity',
        'disconall',
        'getroleicon',
        'deafall',
        'setchannel',
        'messages',
        'stopsendcount',
        'resetcount',
        'guildinfo'
      ]

      if (inguildCommands.find(inguildCommand => inguildCommand === command)) {
        if (!(await isGuild(interaction))) return
      }

      if (command === 'help') {
        const result = await ping.promise.probe('8.8.8.8')
        await interaction.reply({
          embeds: [{
            description: 'サポート鯖: https://discord.gg/ky97Uqu3YY\n\n**注意点**\n・音楽再生中にVCを移動させるとキューが消えます。仕様です。\n・数時間レベルの長さの曲を流そうとすると退出してしまう問題があります。原因が分かり次第修正します。\n・/songhistoryの合計時間は/skipすると現実時間よりも長い時間になります。\n・/setvolumeについて...実行した人が管理者権限を持っているか否かに基づいて制限が取っ払われます\n・メッセージカウント機能は/setchannelで有効化、/stopcountで無効化、/messagesで現時点のメッセージ数を送信します。\n・日本時間0時に/setchannelで指定したチャンネルに当日末時点のメッセージ数を送信し、カウントをリセットします。\n・デバッグが行き届いていない箇所が多いためじゃんじゃん想定外の事をして下さい。',
            color: mutaoColor,
            footer: {
              icon_url: `${adminicon}`,
              text: `Made by ${adminname}・${result.time}ms`
            }
          }]
        })
      } else if (command === 'ping') {
        await interaction.deferReply()
        const embed = new EmbedBuilder()
          .setTitle('Pong!')
          .setFields([
            {
              name: 'ping 8.8.8.8',
              value: `${await googlePing()} ms`,
              inline: true
            },
            {
              name: 'WebSocket',
              value: `${client.ws.ping === -1 ? 'none' : `${client.ws.ping} ms`}`,
              inline: true
            },
            {
              name: 'API Endpoint',
              value: 'waiting...',
              inline: true
            }
          ])
          .setColor(mutaoColor)
        const reply = await interaction.followUp({ embeds: [embed] })
        const apiEndpoint = reply.createdTimestamp - interaction.createdTimestamp
        embed
          .spliceFields(-1, 1)
          .addFields([
            {
              name: 'API Endpoint',
              value: `${apiEndpoint} ms`,
              inline: true
            }
          ])
        await interaction.editReply({ embeds: [embed] })
      } else if (command === 'play') {
        let vc = await option.getChannel('vc')
        vc = vc || interaction.member.voice.channel
        vc = vc || interaction.guild.members.me.voice.channel
        if (!vc) return await interaction.reply({ content: 'playコマンド\nVCに入るか\nVC指定するか', ephemeral: true })
        if (!vc.joinable) return await interaction.reply({ content: 'VCに接続できないよ！', ephemeral: true })

        let url = String(option.getString('url')).replace('&feature=share', '')
        const volume = await option.getInteger('vol')
        let vol = volume || 30
        if (vol > 50 && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) vol = 50

        if ((url.match('youtube.com') || url.match('youtu.be')) && url.match('si=')) url = url.substring(0, url.indexOf('si=')).slice(0, -1)

        await interaction.deferReply()
        const track = await discordplayer.search(url, {
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO
        })
        if (!track.hasTracks()) return await interaction.followUp('何かしらの原因により処理できません。')

        const getqueue = useQueue(interaction.guild.id)
        if (!getqueue) {
          const currentNickname = interaction.guild.members.me.nickname
          if (currentNickname !== null) {
            const json = JSON.parse(fs.readFileSync(nicknameData))
            if (!json.find(guild => guild.id === interaction.guild.id)) {
              json.push({
                id: interaction.guild.id,
                nickname: currentNickname
              })
            }
            fs.writeFileSync(nicknameData, Buffer.from(JSON.stringify(json)))
          }
        }
        const urlboolean = (url.startsWith('http://') || url.startsWith('https://'))
        const queuesize = urlboolean ? (getqueue ? getqueue.getSize() : 0) + track.tracks.length : (getqueue ? getqueue.getSize() : 0) + 1
        const queuenumber = getqueue ? `${getqueue.getSize() + 1}番目に追加｜キュー内合計: ${queuesize}曲` : '再生開始'

        let queue
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
          })
        } catch (error) {
          logger.info(today())
          logger.error(error)
          useQueue(interaction.guild.id).delete()
          return await interaction.followUp('処理中にエラーが発生しました。')
        };

        let t; let description; let thumbnail

        if (track.hasPlaylist()) {
          t = track.playlist
          thumbnail = t.tracks[0].thumbnail
          description = `**合計時間:** ${t.estimatedDuration === 0 ? 'ライブのみ' : t.durationFormatted}\n**曲数:** ${t.tracks.length}曲`
        } else {
          t = track.tracks[0]
          thumbnail = t.thumbnail
          description = `**投稿者:** ${t.author}\n**長さ:** ${t.durationMS === 0 ? 'ライブ' : t.duration}`
        };
        if (!urlboolean) description = `${description}\n**検索ワード:** ${url.substring(0, 15)}${url.length > 15 ? '...' : ''}`

        if (!getqueue) queue.queue.history.push(queue.queue.currentTrack)
        await interaction.followUp({
          embeds: [
            {
              title: t.title,
              description,
              thumbnail: { url: thumbnail },
              footer: { text: queuenumber },
              url: t.url,
              color: mutaoColor
            }
          ]
        })
      } else if (command === 'leave') {
        const queue = useQueue(interaction.guild.id)
        if (!queue && interaction.guild.members.me.voice.channel) return await interaction.reply({ content: '多分再起動したのでplayをするかvcから蹴るかして下さいな。', ephemeral: true })
        if (!queue) return await interaction.reply({ content: 'VCに入ってないよ！', ephemeral: true })
        await interaction.deferReply()

        queue.delete()
        await interaction.followUp('またね！')
        await wait(3) // そういう演出
        interaction.deleteReply()
          .catch(_error => {

          })
      } else if (command === 'pause') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)

        queue.node.pause() ? await interaction.reply('一時停止したよ') : await interaction.reply({ content: '既に一時停止中だよ！', ephemeral: true }) // deferReply/followUpをするとephemeralが使えないらしい
      } else if (command === 'unpause') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)

        queue.node.resume() ? await interaction.reply('一時停止を解除したよ') : await interaction.reply({ content: '一時停止がされてなかったよ', ephemeral: true })
      } else if (command === 'clear') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)
        if (queue.getSize() === 0) return await interaction.reply({ content: 'キューの中は既に再生中の曲だけだよ！', ephemeral: true })
        const losttracks = queue.getSize() - 1

        await interaction.deferReply()
        queue.tracks.clear()
        await interaction.followUp(`${losttracks}曲がダイソンの手によってまっさらになったよ`)
      } else if (command === 'queue') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)

        let page = option.getInteger('page')
        if (page === null) page = 1
        const maxpages = (Math.floor(queue.getSize() / 10)) + 1
        if (page > maxpages) return await interaction.reply({ content: ataokanumber, ephemeral: true })

        await interaction.deferReply() // タイムアウト防止

        const pageStart = 10 * (page - 1) // 埋め込み作り☆
        const pageEnd = pageStart + 10
        const tracks = queue.tracks.toArray().slice(pageStart, pageEnd).map((m, i) => { // ですくりぷしょん
          return `**${i + pageStart + 1}.** (${m.duration === '0:00' ? 'ライブ' : m.duration}) [${m.title.length <= 20 ? m.title : `${m.title.substring(0, 20)}...`}](${m.url})`
        })

        const length = (queue.estimatedDuration + (queue.currentTrack.durationMS - queue.node.streamTime)) / 1000 // 再生中の曲の長さが含まれてないから足す
        const queuelength = (queue.estimatedDuration + queue.currentTrack.durationMS === 0) ? 'ライブ配信のみ' : `キュー内合計: ${times(length)}`

        const streamtime = queue.currentTrack.durationMS === 0 ? 'ライブ' : `${queue.node.getTimestamp().current.label} / ${queue.currentTrack.duration}`

        return await interaction.followUp({
          embeds: [{
            title: queuelength,
            description: `**再生中:** (${streamtime}) [${queue.currentTrack.title.length <= 20 ? queue.currentTrack.title : `${queue.currentTrack.title.substring(0, 20)}...`}](${queue.currentTrack.url})\n\n${tracks.join('\n')}${queue.getSize() > pageEnd ? `\n**...**\n**他:** ${queue.getSize() - pageEnd}曲` : ''}`, // 表示したキューの後にいくつかの曲があったらその曲数を表示
            thumbnail: {
              url: queue.currentTrack.thumbnail
            },
            color: mutaoColor,
            footer: {
              text: `ページ: ${page}/${maxpages}`
            }
          }]
        })
      } else if (command === 'skip') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)
        let number = option.getInteger('to')
        if (number && (number < 1 || number > queue.getSize())) return await interaction.reply({ content: ataokanumber, ephemeral: true })
        await interaction.deferReply()

        let t
        if (queue.repeatMode === 3 && !queue.tracks.toArray()[0]) {
          queue.node.skip()
          await wait(5)

          t = queue.currentTrack
        } else if (!queue.tracks.toArray()[0]) {
          await interaction.followUp('キューが空になったよ！またね！')
          await wait(1) // そういう演出
          queue.delete()
          await wait(2)
          await interaction.deleteReply()
          return
        } else if (number) {
          number = number - 1
          t = queue.tracks.toArray()[number]
          queue.node.skipTo(t)
        } else {
          t = queue.tracks.toArray()[0]
          queue.node.skip()
        };

        const embed = {
          embeds: [
            {
              description: `**再生開始:**${t.title.length < 15 ? ` [${t.title}](${t.url})` : `\n[${t.title}](${t.url})`}\n**リクエスト者:** ${t.requestedBy.username}\n**長さ:** ${t.durationMS === 0 ? 'ライブ' : t.duration}`,
              color: mutaoColor,
              thumbnail: { url: t.thumbnail }
            }
          ]
        }
        if (queue.getSize() !== 0) embed.embeds[0].title = `**残り:** ${queue.estimatedDuration === 0 ? 'ライブのみ' : queue.durationFormatted} / ${queue.getSize()}曲`
        if (number) embed.embeds[0].description = `${embed.embeds[0].description}\n${number + 1}曲スキップしました。`
        await interaction.followUp(embed)
      } else if (command === 'nowp' || command === 'songinfo') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)
        let num = option.getInteger('number')
        if (num < 0 || num > queue.getSize()) return await interaction.reply({ content: ataokanumber, ephemeral: true })
        const vol = queue.node.volume

        let t; let time
        if (command === 'nowp' || !num) {
          t = queue.currentTrack
          const progress = queue.node.createProgressBar() // 埋め込み作り(discordplayer神)
          time = queue.node.getTimestamp().progress === Infinity ? '\n**ライブ配信**' : `\n**残り:** ${times((queue.currentTrack.durationMS - queue.node.getTimestamp().current.value) / 1000)}\n\n**${progress}**`
        } else {
          num = num - 1
          t = queue.tracks.toArray()[num]
          time = `\n**長さ:** ${t.durationMS === 0 ? 'ライブ' : t.duration}`
        }

        await interaction.reply({
          embeds: [
            {
              title: t.title,
              url: t.url,
              thumbnail: { url: t.thumbnail },
              description: `**投稿者:** ${t.author}\n**リクエスト:** ${t.requestedBy.username}${time}`,
              color: mutaoColor,
              footer: { text: `今までに${queue.history.getSize()}曲再生しました｜ボリューム: ${vol}%` }
            }
          ]
        })
      } else if (command === 'loop') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)

        const mode = option.get('mode')
        if (queue.repeatMode === mode.value) return await interaction.reply({ content: '既にそのモードです！', ephemeral: true })
        queue.setRepeatMode(mode.value)
        let sendmode

        if (mode.value === QueueRepeatMode.TRACK) {
          sendmode = 'リピート対象を**1曲**に変えたよ！'
        } else if (mode.value === QueueRepeatMode.QUEUE) {
          sendmode = 'リピート対象を**キュー**に変えたよ！'
        } else if (mode.value === QueueRepeatMode.AUTOPLAY) {
          sendmode = 'リピートを**autoplay**に設定したよ！'
        } else if (mode.value === QueueRepeatMode.OFF) {
          sendmode = 'リピートを**解除**したよ！'
        };
        await interaction.reply(sendmode)
      } else if (command === 'remove') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)
        const number = option.getInteger('number')
        const track = queue.tracks.toArray()[number - 1]

        if (number > queue.getSize()) return await interaction.reply({ content: ataokanumber, ephemeral: true })

        await interaction.deferReply()
        await interaction.followUp(`**${number}.** ${track.title}を削除したよ！`)
        queue.node.remove(track)
      } else if (command === 'songhistory') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)
        let page = option.getInteger('page')
        if (page === null) page = 1
        if (page > ((Math.floor(queue.history.getSize() / 10)) + 1)) return await interaction.reply({ content: ataokanumber, ephemeral: true })
        if (queue.history.getSize() === 0) return await interaction.reply({ content: '履歴はまだ保存されていません', ephemeral: true })

        await interaction.deferReply()
        const pageEnd = (-10 * (page - 1)) - 1
        const pageStart = (pageEnd - 10)
        const tracks = queue.history.tracks.toArray().slice(pageStart, pageEnd).reverse().map((m, i) => {
          return `**${i + (pageEnd * -1)}.** (${m.duration === '0:00' ? 'ライブ' : m.duration}) [${m.title.substring(0, 20)}${m.title.length > 20 ? '...' : ''}](${m.url})`
        })

        let trackslength
        if (queue.history.getSize() === 1) {
          trackslength = queue.node.streamTime
        } else {
          const length = queue.history.tracks.toArray().slice(0, queue.history.getSize() - 1).map((m) => {
            return m.durationMS
          })
          const reducer = (sum, currentValue) => sum + currentValue
          trackslength = length.reduce(reducer) + queue.node.streamTime
        };

        trackslength = trackslength === 0 ? 'ライブ' : times(trackslength / 1000)

        await interaction.followUp({
          embeds: [
            {
              title: `今までに${trackslength} / ${queue.history.getSize()}曲再生したよ！`,
              description: `**再生中:** (${queue.node.getTimestamp().progress === Infinity ? 'ライブ' : `${queue.node.getTimestamp().current.label} / ${queue.currentTrack.duration}`}) [${queue.currentTrack.title.substring(0, 20)}${queue.currentTrack.title.length > 20 ? '...' : ''}](${queue.currentTrack.url})\n\n${tracks.join('\n')}${queue.history.getSize() > (pageStart * -1) ? `\n**...**\n**他:** ${queue.history.getSize() + pageStart}曲` : ''}`,
              color: mutaoColor,
              thumbnail: {
                url: queue.currentTrack.thumbnail
              },
              footer: {
                text: `ページ: ${page}/${(Math.floor(queue.history.getSize() / 10)) + 1}`
              }
            }
          ]
        })
      } else if (command === 'shuffle') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)
        if (queue.getSize() === 1) return await interaction.reply({ content: 'キュー内は1曲しか無いよ！', ephemeral: true })

        await interaction.deferReply()
        queue.tracks.shuffle()
        await interaction.followUp(`${queue.tracks.data.length}曲をぐしゃぐしゃにしたよ！`)
      } else if (command === 'setvolume') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)
        let vol = option.getInteger('vol')
        if (vol > 50 && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) vol = 50

        const success = queue.node.setVolume(vol)
        await interaction.reply(`${success ? `ボリュームを${vol}%に設定しました。` : 'なんかセットできませんでした。'}`)
        await wait(3)
        interaction.deleteReply()
          .catch(_error => {

          })
      } else if (command === 'seek') {
        const returnmusic = returnMusic(interaction)
        if (returnmusic) return await interaction.reply({ content: returnmusic, ephemeral: true })
        const queue = useQueue(interaction.guild.id)
        const seek = option.getNumber('seek')
        await interaction.deferReply()

        await queue.node.seek(seek * 1000) ? await interaction.followUp(`${seek}秒に移動したよ！`) : await interaction.followUp(ataokanumber)
      } else if (command === 'userinfo') {
        const id = await option.getString('id')
        let userinfo
        try {
          userinfo = await client.users.fetch(id)
        } catch (error) {
          return await interaction.reply({ content: '指定したIDはユーザーではありません。', ephemeral: true })
        };

        await interaction.reply({
          embeds: [{
            title: `${userinfo.tag}`,
            description: `**作成日:** ${today(userinfo.createdAt)}\n**bot:** ${userinfo.bot ? 'YES' : 'NO'}\n**プロフ:** <@${userinfo.id}>`,
            color: userinfo.accentColor ? userinfo.accentColor : mutaoColor,
            thumbnail: { url: avatarToURL(userinfo) }
          }]
        })
      } else if (command === 'role') {
        const group = option.getSubcommandGroup()
        const manage = option.getSubcommand()
        if (!(await permissionHas(interaction, PermissionFlagsBits.ManageRoles, notHasManageRole)) && (manage === 'add' || manage === 'remove')) return
        const user = option.getMember('user')
        const role = option.getRole('role')

        if (group === 'user') {
          if (manage === 'add' || manage === 'remove') {
            if ((await managerole(user, manage, role, interaction)) === false) return
            const content = manage === 'add' ? `${user.displayName} への ${role.name} の付与が完了しました。` : `${user.displayName} から ${role.name} の剥奪が完了しました。`
            await interaction.reply(content)
          } else {
            const size = user.roles.cache.size
            if (size === 1) return await interaction.reply({ content: `対象のユーザー ${user.displayName} にロールが付いていません。`, ephemeral: true })
            const rolesize = (await interaction.guild.roles.fetch()).size
            const highest = user.roles.highest
            const color = user.roles.color
            await interaction.reply({
              embeds: [
                {
                  title: `${user.user.tag} のロール一覧 (${size - 1})`,
                  description: `${user.roles.cache.map(role => {
                    if (role.name === '@everyone') return
                    return `${role}`
                  }).join('\n')}\n**最上位:** ${highest} (${rolesize - highest.rawPosition} / ${rolesize})${color !== null ? `\n**色**: ${color} (${color.hexColor})` : ''}`,
                  color: color ? color.color : mutaoColor,
                  thumbnail: { url: avatarToURL(user.user) }
                }
              ]
            })
          };
        } else {
          const members = await interaction.guild.members.fetch()
          const ignore = option.getBoolean('ignorebot')
          let membersize = 0
          members.map(member => {
            if (group === 'all') {
              if (ignore && member.user.bot) return
            } else {
              if (!member.user.bot) return
            };
            const has = roleHas(member, role)
            if (manage === 'add') {
              if (has) return
            } else {
              if (!has) return
            };
            membersize++
          })
          if (membersize === 0) return await interaction.reply({ content: '対象人数が0人です。', ephemeral: true })

          let content = manage === 'add' ? `${membersize}人に ${role.name} の付与を開始します。` : `${membersize}人から ${role.name} の剥奪を開始します。`
          await interaction.reply(content)

          await Promise.all(members.map(async member => {
            if (group === 'all') {
              if (ignore && member.user.bot) return
            } else {
              if (!member.user.bot) return
            };
            const has = roleHas(member, role)
            if (manage === 'add') {
              if (has) return
              await member.roles.add(role)
            } else {
              if (!has) return
              await member.roles.remove(role)
            };
          }))

          content = manage === 'add' ? `${membersize}人への ${role.name} の付与が完了しました。` : `${membersize}人からの ${role.name} の剥奪が完了しました。`
          interaction.user.send(content).catch(_error => { })
          interaction.fetchReply()
            .then(async () => { return await interaction.editReply(content) })
            .catch(_error => {
              interaction.channel.send(content)
                .catch(_error => { })
            })
        };
      } else if (command === 'send') {
        try {
          const description = option.getString('description')
          const channel = option.getChannel('channel')
          if (!option.getBoolean('embed')) {
            const attachmentimage = option.getAttachment('attachmentimage')
            const urlimage = option.getString('urlimage')
            const image = attachmentimage ? attachmentimage.url : urlimage
            const content = {}
            content.content = description
            if (image !== null && (image.startsWith('http://') || image.startsWith('https://'))) {
              content.files = []
              content.files.push(image)
            };
            return await (await interaction.guild.channels.fetch(channel.id)).send(content)
          };
          const embed = {
            embeds: [
              {
                description
              }
            ]
          }
          const title = option.getString('title')
          if (title !== null) embed.embeds[0].title = title
          const url = option.getString('url')
          if (url !== null) embed.embeds[0].url = url
          const attachmentimage = option.getAttachment('attachmentimage')
          const urlimage = option.getString('urlimage')
          const image = attachmentimage ? attachmentimage.url : urlimage
          if (image !== null && (image.startsWith('http://') || image.startsWith('https://'))) embed.embeds[0].image = { url: image }
          const attachmentthumbnail = option.getAttachment('attachmentthumbnail')
          const urlthumbnail = option.getString('urlthumbnail')
          const thumbnail = attachmentthumbnail ? attachmentthumbnail.url : urlthumbnail
          if (thumbnail !== null && (thumbnail.startsWith('http://') || thumbnail.startsWith('https://'))) embed.embeds[0].thumbnail = { url: thumbnail }
          const authortext = option.getString('authortext')
          const authorurl = option.getString('authorurl')
          const attachmentauthorimage = option.getAttachment('attachmentauthorimage')
          const urlauthorimage = option.getString('urlauthorimage')
          if (authortext !== null || authorurl !== null || attachmentauthorimage !== null || urlauthorimage !== null) embed.embeds[0].author = {}
          if (authortext !== null) embed.embeds[0].author.name = authortext
          if (authorurl !== null) embed.embeds[0].author.url = authorurl
          const authorimage = attachmentauthorimage ? attachmentauthorimage.url : urlauthorimage
          if (authorimage !== null && (authorimage.startsWith('http://') || authorimage.startsWith('https://'))) embed.embeds[0].author.icon_url = authorimage
          const footertext = option.getString('footertext')
          const attachmentfooterimage = option.getAttachment('attachmentfooterimage')
          const urlfooterimage = option.getString('urlfooterimage')
          if (footertext !== null || attachmentfooterimage !== null || urlfooterimage !== null) embed.embeds[0].footer = {}
          if (footertext !== null) embed.embeds[0].footer.text = footertext
          const footerimage = attachmentfooterimage ? attachmentfooterimage.url : urlfooterimage
          if (footerimage !== null && (footerimage.startsWith('http://') || footerimage.startsWith('https://'))) embed.embeds[0].footer.icon_url = footerimage
          const rgbcolor = option.getInteger('color')
          const hexcolor = option.getString('hexcolor')
          if (rgbcolor !== null || hexcolor !== null) {
            if (hexcolor === null || (hexcolor !== null && rgbcolor !== null)) embed.embeds[0].color = rgbcolor
            if (rgbcolor === null) {
              const color = parseInt(hexcolor, 16)
              if (!color) return await interaction.reply({ content: `カラーコード${hexcolor}は16進数である必要があります。`, ephemeral: true })
              if (color > 16777215) return await interaction.reply({ content: `変換後のカラーコード(${color})が16777215を超えているため適応できません。`, ephemeral: true })
              embed.embeds[0].color = color
            };
          };

          (await (await interaction.guild.channels.fetch(channel.id)).send(embed))
        } catch (error) {
          return await interaction.reply({ content: `権限的か開発者のミスかそういう仕様で送信できませんでした。\n${error}`, ephemeral: true })
        };
        await interaction.reply('送信できました！')
      } else if (command === 'siranami') {
        await interaction.reply('https://www.youtube.com/@ShiranamIroriCH')
      } else if (command === 'ggrks') {
        await interaction.reply('https://google.com')
      } else if (command === 'getthumbnail') {
        let thumbnail
        const url = option.getString('url')
        if (url !== null) {
          const track = await discordplayer.search(url, {
            searchEngine: QueryType.AUTO
          })
          if (!track.hasTracks()) return await interaction.reply({ content: '処理できません。', ephemeral: true })
          thumbnail = track.tracks[0].thumbnail
        } else if (useQueue(interaction.guild.id) !== null) {
          thumbnail = useQueue(interaction.guild.id).currentTrack.thumbnail
        } else {
          return await interaction.reply({ content: 'URLを指定するか曲を再生して下さい。', ephemeral: true })
        }
        interaction.reply({
          embeds: [
            {
              title: '画像URL',
              image: {
                url: thumbnail
              },
              url: thumbnail,
              color: mutaoColor
            }
          ]
        }).catch(async error => {
          logger.info(today())
          logger.error(error)
        })
      } else if (command === 'trans') {
        await interaction.deferReply()
        const sourcetext = option.getString('sourcetext')
        const outlang = option.getString('outlang')

        const result = await translate({
          free_api: true,
          text: sourcetext,
          target_lang: outlang,
          auth_key: API_KEY
        })

        if (result.status !== 200) return await interaction.reply(`${result.status}\n${result.statusText}`)
        const translated = result.data.translations[0]

        await interaction.followUp({
          embeds: [{
            title: `${translated.detected_source_language} → ${outlang}`,
            description: `${translated.text.substring(0, 4096)}${translated.text.length > 4096 ? '...' : ''}`,
            color: mutaoColor
          }]
        })
      } else if (command === 'today') {
        const dt = new Date()
        const y = dt.getFullYear()
        const m = dt.getMonth()
        const d = dt.getDate()
        const mprog = Math.floor(dt.getDate() / (new Date(y, (m + 1), 0).getDate()) * 100)
        const drem = (new Date(y, (m + 1), 0).getDate()) - dt.getDate()
        const dprog = Math.floor((dt.getTime() - (new Date(y, m, d).getTime())) / (24 * 60 * 60 * 1000) * 100)
        const mrem = Math.floor(((new Date(y, m, d + 1).getTime()) - dt.getTime()) / 1000 / 60)
        const yprog = Math.floor((dt.getTime() - (Date.parse(`${y - 1}/12/31`))) / (365 * 24 * 60 * 60 * 1000) * 100)
        const dyrem = Math.floor((Date.parse(`${y}/12/31`) - dt.getTime()) / 1000 / 60 / 60 / 24)
        await interaction.reply(`${today(dt)}\n今日の進行度: ${dprog}%(残り${mrem}分)\n今月の進行度: ${mprog}%(残り${drem}日)\n今年の進行度: ${yprog}%(残り${dyrem}日)`)
      } else if (command === 'searchimage') {
        const image = option.getAttachment('image')
        const url = option.getString('url')
        if (!image && !url) return await interaction.reply({ content: '画像かURLを指定して下さい。', ephemeral: true })
        if (image && url) return await interaction.reply({ content: 'どちらか一方のみを指定して下さい', ephemeral: true })
        const imageurl = image ? image.url : url
        const apiurl = `https://api.irucabot.com/imgcheck/check_url?url=${imageurl}`
        await interaction.deferReply()

        const result = await (await fetch(apiurl, { method: 'GET' })).json()
        if (result.status === 'error') return await interaction.followUp(`${result.code}\n${result.message_ja}`)
        let description
        let color
        if (!result.found) {
          description = '画像はヒットしませんでした。'
          color = redcolor
        } else {
          description = `[${result.count}個の画像がヒットしました。](${result.resulturl})`
          color = mutaoColor
        };
        await interaction.followUp({
          embeds: [
            {
              description,
              color,
              thumbnail: {
                url: imageurl
              }
            }
          ]
        })
      } else if (command === 'avatar') {
        const id = option.getString('id')
        const member = option.getUser('member')
        if (!id && !member) return await interaction.reply({ content: 'どちらかを指定してね', ephemeral: true })
        if (id && member) return await interaction.reply({ content: 'どちらか一方を指定してね', ephemeral: true })
        let user
        try {
          user = id ? await client.users.fetch(id) : member
        } catch (error) {
          return await interaction.reply({ content: 'ユーザーのIDを指定して下さい', ephemeral: true })
        }
        const avatar = avatarToURL(user)

        await interaction.reply({
          embeds: [
            {
              title: '画像URL',
              url: avatar,
              image: {
                url: avatar
              },
              color: mutaoColor
            }
          ]
        })
      } else if (command === 'startactivity') {
        if (!interaction.guild) return await interaction.reply('サーバー内で実行して下さい')
        if (!interaction.member.voice.channel) return await interaction.reply({ content: 'VCに入ってから実行して下さい', ephemeral: true })
        const game = option.getString('activity')

        discordTogether.createTogetherCode(interaction.member.voice.channel.id, game).then(async invite => {
          if (invite.code === '50035') return await interaction.reply({ content: '存在しないアクティビティです', ephemeral: true })
          return await interaction.reply(invite.code)
        })
      } else if (command === 'saveemoji') {
        const emoji = option.getString('emojiid')
        let type = option.get('type')
        if (!Number(emoji)) return await interaction.reply(String(emoji).replace('<', '').replace('>', '').replace(':', ''))

        if (type === null || type.value === 'png') type = 'png'
        if (type.value === 'gif') type = 'gif'
        const url = `https://cdn.discordapp.com/emojis/${emoji}.${type}?size=4096`
        await interaction.reply({
          embeds: [
            {
              description: `[絵文字画像のURL](${url})`,
              image: {
                url
              },
              color: mutaoColor
            }
          ]
        })
      } else if (command === 'messages') {
        const json = JSON.parse(fs.readFileSync(guildsData))
        const guild = json.find(guild => guild.id === interaction.guild.id)
        if (!guild) {
          writedefault(interaction.guild.id)
          await interaction.reply({ content: 'データが新規に作成されました。\nカウント数の定期送信をするには/setchannelをして下さい。', ephemeral: true })
          return
        };

        await interaction.reply({
          embeds: [
            {
              author: {
                name: interaction.guild.name,
                icon_url: interaction.guild.iconURL({ extension: 'png', size: 4096 })
              },
              description: `メッセージ数: ${guild.count}${guild.send_count_channel !== null ? '' : '\n現在定期送信が停止されています。'}`,
              color: mutaoColor
            }
          ]
        })
      } else if (command === 'disconall') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: '管理者権限所持者のみ実行できます', ephemeral: true })
        let vc = option.getChannel('vc')
        if (vc === null && interaction.member.voice.channel) return await interaction.reply({ content: 'VCを指定するかVCに入室して下さい。', ephemeral: true })
        if (vc === null) vc = interaction.member.voice.channel
        if (!vc.members) return await interaction.reply({ content: '指定先のVCには誰もいません。', ephemeral: true })
        const memberssize = vc.members.size
        await interaction.deferReply()
        try {
          vc.members.map(async m => await m.voice.disconnect())
        } catch (error) {
          return await interaction.followUp('権限が変更されました。')
        };
        await interaction.followUp(`${memberssize}人を切断しました。`)
      } else if (command === 'banner') {
        const type = option.getBoolean('gif') ? 'gif' : 'png'
        let id = option.getString('id')
        const member = option.getUser('member')
        if (id === null && !member) id = interaction.user.id
        if (member) id = member.id
        const result = await (await fetch(`https://discord.com/api/users/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`
          },
          json: true
        })).json()
        if (result.user_id) return await interaction.reply({ content: 'ユーザーが見つかりませんでした。', ephemeral: true })
        if (!result.banner && !result.banner_color) return await interaction.reply({ content: 'バナー画像も色も取得できませんでした。', ephemeral: true })
        const url = result.banner ? `https://cdn.discordapp.com/banners/${id}/${result.banner}.${type}?size=4096` : null
        const description = result.banner ? `[バナーの画像URL](${url})` : `バナーの色コード: ${result.banner_color}`
        const color = result.banner_color ? result.accent_color : 0
        await interaction.reply({
          embeds: [
            {
              description,
              image: {
                url
              },
              color
            }
          ]
        })
      } else if (command === 'getroleicon') {
        const role = option.getRole('role')
        if (!role.iconURL()) return await interaction.reply({ content: '指定されたロールにアイコンはありませんでした。', ephemeral: true })
        const url = role.iconURL({ size: 4096, extension: 'png' })
        await interaction.reply({
          embeds: [
            {
              description: `[アイコンの画像URL](${url})`,
              image: { url },
              color: role.color ? role.color : 0
            }
          ]
        })
      } else if (command === 'deafall') {
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.DeafenMembers)) return await interaction.reply({ content: 'スピーカーミュートする権限がありません！', ephemeral: true })
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: '管理者権限所持者のみ実行できます。', ephemeral: true })
        let vc = option.getChannel('vc')
        vc = vc || interaction.member.voice.channel
        if (!vc) return await interaction.reply({ content: 'vcに参加するか指定して下さい。', ephemeral: true })
        if (!vc.members) return await interaction.reply({ content: '指定先のvcには誰もいません', ephemeral: true })
        let cancel = option.getBoolean('cancel')
        cancel = !cancel
        const membersize = vc.members.size

        await interaction.deferReply()
        try {
          await vc.members.map(async m => await m.voice.setDeaf(cancel))
        } catch (error) {
          return await interaction.followUp('権限的に無理でした。')
        };

        await interaction.followUp(cancel ? `${membersize}人をスピーカーミュートしました。` : `${membersize}人のスピーカーミュートを解除しました。`)
      } else if (command === 'setchannel') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: '管理者権限所持者のみ実行できます', ephemeral: true })
        await interaction.deferReply()
        const channel = option.getChannel('channel')
        const json = JSON.parse(fs.readFileSync(guildsData))
        if (!json.find(guild => guild.id === interaction.guild.id)) {
          json.push(
            {
              id: interaction.guild.id,
              send_count_channel: channel.id,
              count: 0
            }
          )
          fs.writeFileSync(guildsData, Buffer.from(JSON.stringify(json)))
          return await interaction.followUp(`カウント数送信先チャンネルを設定しました。\n<#${channel.id}>`)
        };
        json.find(guild => guild.id === interaction.guild.id).send_count_channel = channel.id
        fs.writeFileSync(guildsData, Buffer.from(JSON.stringify(json)))
        await interaction.followUp(`カウント数送信先チャンネルを設定しました。\n<#${channel.id}>`)
      } else if (command === 'stopsendcount') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: '管理者権限所持者のみ実行できます', ephemeral: true })
        const json = JSON.parse(fs.readFileSync(guildsData))
        const guild = json.find(guild => guild.id === interaction.guild.id)
        if (!guild) {
          writedefault(interaction.guild.id)
          return await interaction.reply({ content: 'データが新規に作成されました。定期送信はデフォルトで無効です。\n/setchannelで有効化します。', ephemeral: true })
        };
        json.find(guild => guild.id === interaction.guild.id).send_count_channel = null
        fs.writeFileSync(guildsData, Buffer.from(JSON.stringify(json)))
        await interaction.reply('定期送信をストップしました。')
      } else if (command === 'delmessages') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: '管理者権限所持者のみ実行できます。', ephemeral: true })

        const channel = option.getChannel('channel')

        const me = interaction.guild.members.me
        if (!me.permissions.has(PermissionFlagsBits.ManageMessages) || !me.permissionsIn(channel.id).has(PermissionFlagsBits.ManageMessages)) return await interaction.reply({ content: 'メッセージを管理する権限がありません！', ephemeral: true })

        const num = option.getInteger('number')

        await interaction.reply(`<#${channel.id}>内の${num}個のメッセージを削除しています...。`)
        const fetchreply = await interaction.fetchReply()

        try {
          await Promise.all((await channel.messages.fetch({ limit: num })).map(async message => {
            if (fetchreply.id === message.id) return
            await message.delete()
          }))
        } catch (error) {
          return interaction.editReply('権限が変更されました。').catch(e => {
            return interaction.channel.send('権限が変更されたか、チャンネルが削除されました。').catch(e => {

            })
          })
        };

        const finish = `<#${channel.id}>内の${num}個のメッセージを削除しました。`
        interaction.editReply(finish).catch(e => interaction.channel.send(finish).catch(error => { logger.error(error) }))
        interaction.user.send(finish).catch(error => { logger.error(error) })
      } else if (command === 'deeplusage') {
        const result = await (await fetch('https://api-free.deepl.com/v2/usage', {
          method: 'GET',
          headers: {
            Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`
          }
        })).json()
        await interaction.reply({
          embeds: [
            {
              description: `**今月の翻訳文字数:** ${result.character_count}文字\n**残り:** ${result.character_limit - result.character_count}文字`,
              color: mutaoColor
            }
          ]
        })
      } else if (command === 'resetcount') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: '管理者権限所持者のみ実行できます。', ephemeral: true })

        const guilds = JSON.parse(fs.readFileSync(guildsData))
        if (!guilds.find(guild => guild.id === interaction.guild.id)) {
          writedefault(interaction.guild.id)
          return await interaction.reply({ content: 'データが新規に作成されました。カウントはデフォルトで無効です。\n/setchannelで有効化します。', ephemeral: true })
        };

        guilds.find(guild => guild.id === interaction.guild.id).count = 0
        fs.writeFileSync(guildsData, Buffer.from(JSON.stringify(guilds)))

        await interaction.reply('リセットが完了しました。')
      } else if (command === 'guildinfo') {
        const guild = interaction.guild
        const iconurl = guild.iconURL({ size: 4096, extension: 'png' })
        const geticon = option.getBoolean('icon')
        const owner = await guild.fetchOwner()
        const ownercolor = owner.roles.color ? owner.roles.color.color : mutaoColor

        if (geticon) {
          if (!iconurl) return await interaction.reply({ content: 'アイコンが設定されていません。', ephemeral: true })

          return await interaction.reply({
            embeds: [
              {
                title: '画像URL',
                url: iconurl,
                image: { url: iconurl },
                color: ownercolor
              }
            ]
          })
        };

        let i = 0
        let ignorebot;
        (await guild.members.fetch()).map(member => {
          if (member.user.bot) return
          i = i + 1
          ignorebot = i
        })

        const joinNowTime = Math.floor((new Date().getTime() - guild.joinedTimestamp) / 1000 / 60 / 60 / 24)

        const json = JSON.parse(fs.readFileSync(guildsData))
        const jsonguild = json.find(guild => guild.id === interaction.guild.id)
        if (!jsonguild) writedefault(interaction.guild.id)
        const count = jsonguild ? (jsonguild.send_count_channel !== null ? `<#${jsonguild.send_count_channel}>` : '無効') : '無効'

        await interaction.reply({
          embeds: [
            {
              title: guild.name,
              description: `**サーバー作成日:** ${today(guild.createdAt)}\n**メンバー数:** ${guild.memberCount}人\n**bot除外メンバー数:** ${ignorebot}人\n**滞在期間:** ${joinNowTime}日\n**メッセージカウント定期送信:** ${count}`,
              thumbnail: { url: iconurl || undefined },
              color: ownercolor,
              footer: {
                text: `所有者: ${owner.user.tag} | ${owner.id}`,
                icon_url: avatarToURL(owner.user)
              }
            }
          ]
        })
      } else if (command === 'password') {
        let n = option.getInteger('length')
        if (n === null) n = 8
        let ephemeral = option.getBoolean('ephemeral')
        if (!ephemeral) ephemeral = false
        await interaction.reply({ content: crypto.randomBytes(n).toString('base64').substring(0, n), ephemeral })
      } else if (command === 'setbitrate') {
        if (!(await isGuild(interaction))) return
        const max = interaction.guild.maximumBitrate
        let bitrate = (interaction.options.getInteger('bitrate') * 1000) || max
        if (bitrate > max) bitrate = max
        const channel = (await interaction.guild.channels.fetch()).filter(channel => channel.type === ChannelType.GuildVoice)

        await interaction.deferReply()
        let ignore = 0
        let eq = 0
        let success = 0
        await Promise.all(channel.map(async channel => {
          if (!channel.manageable) return ignore++
          if (channel.bitrate === bitrate) return eq++
          await channel.setBitrate(bitrate)
          return success++
        }))
        if (channel.size === ignore) {
          return await interaction.followUp('全部権限不足で管理できませんでした。')
        } else if (channel.size === eq) {
          return await interaction.followUp('全部既に設定しようとしたビットレートと同じでした')
        } else if (channel.size === (ignore + eq)) {
          return await interaction.followUp('全部権限不足か既に同じビットレートだったかでスキップされました。')
        }
        let content = `${success}個のVCを${bitrate / 1000} Kbpsに設定しました。`
        if (ignore > 0) content = `${content}\n権限不足: ${ignore}`
        if (eq > 0) content = `${content}\nスキップ: ${eq}`
        await interaction.followUp(content)
      } else if (command === 'test') {
        if (interaction.user.id !== '606093171151208448') return await interaction.reply('管理者及び開発者のみ実行可能です。')
        const text = option.getString('text1')
        const track = await discordplayer.search(text, {
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO
        })
        logger.info(track)
        await interaction.reply({ content: 'てすとこんぷりーてっど！', ephemeral: true })
      } else {
        await interaction.reply({ content: '実装されていないコマンド？', ephemeral: true })
      }
    } catch (e) {
      logger.info(today())
      logger.info('interaction エラー')
      logger.error(e)
      if (interaction.user.id !== '606093171151208448') {
        await client.users.cache.get('606093171151208448').send(`${interaction.guild ? `${interaction.guild.name}(${interaction.guild.id})の${interaction.user.tag}` : interaction.user.tag}\nがデバッガーになってくれたお知らせ\n${e}`)
        const error = e
        const errormsg = `エラーが発生したため、確認次第修正に取り掛かります。ご協力お願い致します。\n${error}`
        await interaction.reply(errormsg).catch(async e => await interaction.channel.send(errormsg).catch(async e => await interaction.user.send(errormsg).catch(e => { })))
      } else {
        await interaction.user.send(`おめえエラー起こしてんじゃねえよ\n${e}`)
      }
    }
  })

  client.on(Events.MessageCreate, async message => {
    if (message.author.bot || message.system || !message.guild) return
    if (message.guild.id === '1074670271312711740' && message.author.id === '606093171151208448') {
      if (message.content === 'サーバー一覧') {
        const guilds = client.guilds.cache.map(guild => {
          return `ID: ${guild.id}, Name: ${guild.name} (${guild.memberCount})`
        })
        message.reply(String(`success!\nGuilds (${client.guilds.cache.size})(${client.users.cache.size}):\n${guilds.join('\n')}`).substring(0, 2000))
      };

      if (message.content.match('サーバー詳細')) {
        const guild = await client.guilds.fetch(message.content.slice(7))
        if (!guild) return await message.reply('無い')
        const iconurl = guild.iconURL({ size: 4096, extension: 'png' })
        const owner = await guild.fetchOwner()
        const ownercolor = owner.roles.color ? owner.roles.color.color : mutaoColor

        let i = 0
        let ignorebot;
        (await guild.members.fetch()).map(member => {
          if (member.user.bot) return
          i = i + 1
          ignorebot = i
        })

        const json = JSON.parse(fs.readFileSync(guildsData))
        const jsonguild = json.find(jsonguild => jsonguild.id === guild.id)
        if (!jsonguild) writedefault(guild.id)
        const count = jsonguild ? (jsonguild.send_count_channel !== null ? `<#${jsonguild.send_count_channel}>` : '無効') : '無効'

        const joinNowTime = Math.floor((new Date().getTime() - guild.joinedTimestamp) / 1000 / 60 / 60 / 24)

        await message.reply({
          embeds: [
            {
              title: guild.name,
              description: `**サーバー作成日:** ${today(guild.createdAt)}\n**メンバー数:** ${guild.memberCount}人\n**bot除外メンバー数:** ${ignorebot}人\n**滞在期間:** ${joinNowTime}日\n**メッセージカウント定期送信:** ${count}`,
              thumbnail: { url: iconurl || undefined },
              color: ownercolor,
              footer: {
                text: `所有者: ${owner.user.tag} | ${owner.id}`,
                icon_url: avatarToURL(owner.user)
              }
            }
          ]
        })
      };

      if (message.content === 'メッセージカウント') {
        const json = JSON.parse(fs.readFileSync(guildsData))
        let i = 0
        const guild = await Promise.all(json.map(guild => {
          return client.guilds.fetch(guild.id)
            .then(fetchguild => {
              if (guild.count === 0) return
              return `**${fetchguild.name}:** ${guild.count} [${guild.send_count_channel === null ? ':red_circle:' : ':green_circle:'}] (${guild.id})`
            })
            .catch(_error => {
              i++
            })
        }))
        console.log(guild)
        const ignore = guild.filter(string => string === undefined).length + i
        await message.reply(guild.filter(string => string !== undefined).join('\n') + `\n\n除外: ${ignore} (fetch failed: ${i})\nデータ未生成: ${(await client.guilds.fetch()).size - json.length - i}`)
      }
    }

    try {
      const json = JSON.parse((fs.readFileSync(guildsData)))
      const guild = json.find(guild => guild.id === message.guild.id)
      if (!guild) return writedefault(message.guild.id)

      const count = json.find(guild => guild.id === message.guild.id).count
      json.find(guild => guild.id === message.guild.id).count = count + 1
      fs.writeFileSync(guildsData, Buffer.from(JSON.stringify(json)))
    } catch (error) {
      logger.info(today())
      logger.info('メッセージカウントエラー')
      logger.error(error)
    };
  })

  client.on(Events.GuildCreate, async guild => {
    try {
      const members = await guild.members.fetch()
      let result = 0
      members.map(member => {
        if (member.user.bot) return
        result++
      })

      const owner = await guild.fetchOwner()
      await (await (await client.guilds.fetch('1074670271312711740')).channels.fetch('1144550066531598426')).send({
        embeds: [
          {
            title: `+ ${guild.name} | ${guild.id}`,
            color: greencolor,
            thumbnail: {
              url: guild.iconURL() ? guild.iconURL({ size: 4096, extension: 'png' }) : null
            },
            description: `**人数:** ${guild.memberCount}\n**bot除外人数:** ${result}\n**作成日:** ${today(guild.createdAt)}`,
            footer: {
              text: `所有者: ${owner.user.tag} | ${owner.id}`,
              icon_url: avatarToURL(owner.user)
            }
          }
        ]
      })
    } catch (error) {
      logger.info(today())
      logger.info('guildCreate Error')
      logger.error(error)
    };
  })

  client.on(Events.GuildDelete, async guild => {
    try {
      const owner = await guild.fetchOwner()
      const joinKickTime = Math.floor((new Date().getTime() - guild.joinedTimestamp) / 1000 / 60 / 60 / 24)

      await (await (await client.guilds.fetch('1074670271312711740')).channels.fetch('1144550066531598426')).send({
        embeds: [
          {
            title: `- ${guild.name} | ${guild.id}`,
            color: redcolor,
            thumbnail: {
              url: guild.iconURL() ? guild.iconURL({ size: 4096, extension: 'png' }) : null
            },
            description: `**人数**: ${guild.memberCount}\n**作成日:** ${today(guild.createdAt)}\n**滞在期間:** ${joinKickTime}日`,
            footer: {
              text: `所有者: ${owner.user.tag} | ${owner.id}`,
              icon_url: avatarToURL(owner.user)
            }
          }
        ]
      })
    } catch (error) {

    }
  })

  try {
    discordplayer.events.on('playerTrigger', async queue => {
      if (!queue.guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) return
      await queue.guild.members.me.setNickname(`${queue.currentTrack.title.substring(0, 29)}${queue.currentTrack.title.length > 29 ? '...' : ''}`)
    })

    discordplayer.events.on('queueDelete', async queue => {
      if (!queue.guild.members.me.permissions.has(PermissionFlagsBits.ChangeNickname)) return
      let json = JSON.parse(fs.readFileSync(nicknameData))
      const guild = json.find(guild => guild.id === queue.guild.id)
      if (!guild) return await queue.guild.members.me.setNickname(null)
      await queue.guild.members.me.setNickname(guild.nickname)
      json = json.filter(guild => guild.id !== queue.guild.id)
      fs.writeFileSync(nicknameData, Buffer.from(JSON.stringify(json)))
    })
  } catch (error) {
    logger.info(today())
    logger.info('ニックネーム変えるあたりのエラー')
    logger.error(error)
  };

  discordplayer.on('error', error => {
    if (error.message.match('The operation was aborted')) return
    logger.info(today())
    logger.info('discordplayer エラー')
    logger.error(error)
  })

  // client.on("messageReactionAdd", async (reaction, user) => { // https://discord.gg/M9MmS6k2jT
  //   logger.info(reaction);
  //   if (reaction.message.id !== "1099317662854697091") return;
  //   if (reaction.emoji.name !== "✅") return;
  //   const member = reaction.message.guild.members.resolve(user);
  //   member.roles.add("1099312160284352512");
  // });

  // client.on("messageReactionRemove", async (reaction, user) => {
  //   logger.info(reaction);
  //   if (reaction.message.id !== "1099317662854697091") return;
  //   if (reaction.emoji.name !== "✅") return;
  //   const member = reaction.message.guild.members.resolve(user);
  //   member.roles.remove("1099312160284352512");
  // });

  client.login(process.env.DISCORD_TOKEN).catch(error => {
    logger.info(today())
    logger.info('client.login() エラー')
    logger.error(error)
  })
} catch (error) {
  logger.info(today())
  logger.info('コード全体のエラー')
  logger.error(error)
};
