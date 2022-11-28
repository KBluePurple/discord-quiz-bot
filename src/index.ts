import {ActionRowBuilder, ButtonBuilder, Client, CommandInteraction, EmbedBuilder, GuildMember} from 'discord.js';
import {ButtonStyle, GatewayIntentBits} from 'discord-api-types/v10';
import {registerCommands} from "./CommandRegister";
import EmbedUtil from "./EmbedUtil";

type QuizUser = {
    member: GuildMember,
    answer: string
    score: number
}

type QuizInfo = {
    state: 'ready' | 'start' | 'end',
    question: string,
    answer: string,
    users: QuizUser[]
}

const quizInfo: Map<string, QuizInfo> = new Map();

registerCommands();

const client = new Client({
    intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
});

client.on('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        const commandInteraction = interaction as CommandInteraction;
        if (commandInteraction.commandName === '퀴즈') {
            // @ts-ignore
            switch (commandInteraction.options.getSubcommand()) {
                case '준비':
                    const embed = new EmbedBuilder()
                        .setTitle('Quiz')
                        .setDescription('잠시 후 퀴즈 이벤트가 시작됩니다.\n\n이벤트에 참여하시려면 아래 버튼을 눌러주세요.')
                        .setColor('#2f3136');

                    const button = new ActionRowBuilder()
                        .addComponents([
                            new ButtonBuilder()
                                .setCustomId(`button:${interaction.id}`)
                                .setLabel('퀴즈 참가')
                                .setStyle(ButtonStyle.Primary)
                        ]);

                    quizInfo.set(interaction.id, {
                        state: 'ready',
                        question: '',
                        answer: '',
                        users: []
                    });

                    await interaction.reply({
                        embeds: [embed],
                        // @ts-ignore
                        components: [button],
                    });
                    break;
                case '시작':

                    break;
            }
        }
    } else if (interaction.isButton()) {
        // const modal = new ModalBuilder()
        //     .setCustomId('quiz-modal')
        //     .setTitle('Quiz')
        //     // @ts-ignore
        //     .addComponents([
        //         new ActionRowBuilder().addComponents(
        //             new TextInputBuilder()
        //                 .setCustomId('quiz-answer')
        //                 .setLabel('정답')
        //                 .setStyle(TextInputStyle.Short)
        //                 .setPlaceholder(`정답을 입력해 주세요`)
        //                 .setRequired(true),
        //         ),
        //     ]);
        //
        // await interaction.showModal(modal);

        const quizId = interaction.customId.split(':')[1];

        if (!quizInfo.has(quizId) || quizInfo.get(quizId)?.state !== 'ready') {
            const embed = new EmbedBuilder()
                .setTitle('Quiz')
                .setDescription('⚠ 이미 시작되거나 종료된 이벤트입니다.')
                .setColor('#2f3136');

            await interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
            return;
        }

        if (quizInfo.get(quizId)?.users.find(user => user.member.id === interaction.member?.user.id)) {
            await interaction.reply({
                embeds: [EmbedUtil.warn('이미 참여하셨습니다.')],
                ephemeral: true,
            });
            return;
        }

        quizInfo.get(quizId)?.users.push({
            member: interaction.member as GuildMember,
            answer: '',
            score: 0
        });

        await interaction.reply({
            embeds: [EmbedUtil.success(`✅ 퀴즈에 참가하셨습니다!\n\n현재 참가자 수: **${quizInfo.get(quizId)?.users.length}명**`, {
                text: (interaction.member ? (interaction.member as GuildMember).displayName : interaction.user.username) as string,
                iconURL: interaction.user.avatarURL() ?? undefined,
            })],
        });
    } else if (interaction.isSelectMenu()) {

    } else if (interaction.isModalSubmit()) {

    }
});

client.login('').then(r => console.log(r));