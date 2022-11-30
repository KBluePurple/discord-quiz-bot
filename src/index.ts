import {
    ActionRowBuilder,
    ButtonBuilder, ButtonInteraction,
    ButtonStyle,
    Client,
    CommandInteraction,
    EmbedBuilder,
    GatewayIntentBits,
    GuildMember,
    Message,
    ModalBuilder, ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import {registerCommands} from "./CommandRegister";
import EmbedUtil from "./EmbedUtil";
import {Config} from "./Config";

type QuizUser = {
    member: GuildMember,
    answer: string
    score: number
}

type QuizInfo = {
    id: string,
    state: 'ready' | 'start' | 'end',
    readyMessage: Message | null,
    question: string,
    answer: string,
    users: QuizUser[],
    manager: GuildMember
}

const quizInfos: Map<string, QuizInfo> = new Map();

registerCommands();

const client = new Client({
    intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildMessages,
});

function getQuizInfo(interaction: ButtonInteraction | ModalSubmitInteraction): QuizInfo | null {
    const quizInfo = quizInfos.get(interaction.customId.split(':')[1]);
    if (quizInfo === undefined) {
        return null;
    }
    return quizInfo;
}

client.on('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isCommand()) {
            const commandInteraction = interaction as CommandInteraction;
            if (commandInteraction.commandName === '퀴즈') {
                // @ts-ignore
                switch (commandInteraction.options.getSubcommand()) {
                    case '준비': {
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

                        const message = await interaction.reply({
                            embeds: [embed],
                            // @ts-ignore
                            components: [button],
                            fetchReply: true
                        });

                        quizInfos.set(interaction.id, {
                            id: interaction.id,
                            state: 'ready',
                            readyMessage: message as Message,
                            question: '',
                            answer: '',
                            users: [],
                            manager: interaction.member as GuildMember
                        });
                        break;
                    }
                    case '시작': {
                        const quiz = Array.from(quizInfos.values()).find(quiz => quiz.manager.id === interaction.member?.user.id);
                        if (quiz) {
                            if (quiz.state === 'ready') {
                                await quiz.readyMessage?.edit({
                                    embeds: [EmbedUtil.success('모집 종료!')],
                                    components: []
                                });

                                quiz.state = 'start';

                                await interaction.reply({
                                    embeds: [EmbedUtil.success('퀴즈 이벤트가 시작되었습니다!')]
                                });
                            }
                        } else {
                            await interaction.reply({
                                embeds: [EmbedUtil.error('퀴즈 이벤트를 시작할 수 없습니다!')]
                            });
                        }
                        break;
                    }
                    case '제시': {
                        const quiz = Array.from(quizInfos.values()).find(quiz => quiz.manager.id === interaction.member?.user.id);
                        if (quiz) {
                            if (quiz.state === 'start') {
                                // @ts-ignore
                                quiz.question = commandInteraction.options.getString('문제', true);
                                // @ts-ignore
                                quiz.answer = commandInteraction.options.getString('정답', true);

                                quiz.users.forEach(user => {
                                    user.answer = '';
                                });

                                const button = new ActionRowBuilder()
                                    .addComponents([
                                        new ButtonBuilder()
                                            .setCustomId(`submit:${quiz.id}`)
                                            .setLabel('정답 제출')
                                            .setStyle(ButtonStyle.Primary)
                                    ]);

                                await interaction.reply({
                                    embeds: [EmbedUtil.info('❔ 문제가 제시되었습니다!')
                                        .setFields([
                                            {
                                                name: '문제',
                                                value: quiz.question
                                            }
                                        ])],
                                    // @ts-ignore
                                    components: [button]
                                });
                            }
                        } else {
                            await interaction.reply({
                                embeds: [EmbedUtil.error('퀴즈 이벤트가 없습니다!')],
                                ephemeral: true
                            });
                        }
                        break;
                    }
                    case '정답': {
                        const quiz = Array
                            .from(quizInfos.values())
                            .find(quiz => quiz.manager.id === interaction.member?.user.id);
                        if (quiz) {
                            if (quiz.state === 'start') {
                                const answer = quiz.answer;
                                const users = quiz.users;

                                let str = users
                                    .filter(user => user.answer === answer)
                                    .map(user => user.member.user.username)
                                    .join('\n');

                                if (str.length === 0) {
                                    str = '없음';
                                } else if (str.length > 500) {
                                    str = str.substring(0, 500) + '...';
                                }

                                let str2 = users
                                    .filter(user => user.answer !== answer)
                                    .map(user => `${user.member.user.username} - ${user.answer}`)
                                    .join('\n');

                                if (str2.length === 0) {
                                    str2 = '없음';
                                } else if (str2.length > 500) {
                                    str2 = str2.substring(0, 500) + '...';
                                }

                                await interaction.reply({
                                    embeds: [EmbedUtil.info('🎉 정답을 맞춘 사람들!')
                                        .setFields([
                                            {
                                                name: '정답',
                                                value: answer
                                            },
                                            {
                                                name: '맞춘 사람',
                                                value: str
                                            },
                                            {
                                                name: '틀린 사람',
                                                value: str2
                                            }
                                        ])
                                        .setFooter({
                                            text: `총 ${users.filter(user => user.answer === answer).length}명이 정답을 맞췄습니다!`
                                        })]
                                });
                            }
                        }
                        break;
                    }
                    case '랭킹': {
                        const quiz = Array.from(quizInfos.values()).find(quiz => quiz.manager.id === interaction.member?.user.id);
                        if (quiz) {
                            if (quiz.state === 'start') {
                                const users = quiz.users.sort((a, b) => b.score - a.score);

                                let str = users.map(user => `${user.member.user.username} - ${user.score}점`).join('\n');
                                if (str.length === 0) {
                                    str = '없음';
                                } else if (str.length > 500) {
                                    str = str.substring(0, 500) + '...';
                                }

                                await interaction.reply({
                                    embeds: [EmbedUtil.info('🏆 랭킹')
                                        .setFields([
                                            {
                                                name: '랭킹',
                                                value: str
                                            }
                                        ])]
                                });
                            }
                        }
                        break;
                    }
                    case '종료': {
                        const quiz = Array.from(quizInfos.values()).find(quiz => quiz.manager.id === interaction.member?.user.id);
                        if (quiz) {
                            if (quiz.state === 'start') {
                                quiz.state = 'end';

                                await interaction.reply({
                                    embeds: [EmbedUtil.success('퀴즈 이벤트가 종료되었습니다!')]
                                });
                            }
                        }
                        break;
                    }
                    case '초기화': {
                        const quiz = Array.from(quizInfos.values()).find(quiz => quiz.manager.id === interaction.member?.user.id);
                        if (quiz) {
                            quizInfos.delete(quiz.id);
                            await interaction.reply({
                                embeds: [EmbedUtil.success('퀴즈 이벤트가 초기화되었습니다!')]
                            });
                        }
                        break;
                    }
                }
            }
        } else if (interaction.isButton()) {
            const buttonId = interaction.customId.split(':')[0];
            if (buttonId === 'button') {
                const quizId = interaction.customId.split(':')[1];

                if (!quizInfos.has(quizId) || quizInfos.get(quizId)?.state !== 'ready') {
                    await interaction.reply({
                        embeds: [EmbedUtil.warn('이미 시작되거나 종료된 이벤트입니다.')],
                        ephemeral: true,
                    });
                    return;
                }

                if (quizInfos.get(quizId)?.users.find(user => user.member.id === interaction.member?.user.id)) {
                    await interaction.reply({
                        embeds: [EmbedUtil.warn('이미 참여하셨습니다.')],
                        ephemeral: true,
                    });
                    return;
                }

                quizInfos.get(quizId)?.users.push({
                    member: interaction.member as GuildMember,
                    answer: '',
                    score: 0
                });

                await interaction.reply({
                    embeds: [EmbedUtil.success(`퀴즈에 참가하셨습니다!\n\n현재 참가자 수: **${quizInfos.get(quizId)?.users.length}명**`, {
                        text: (interaction.member ? (interaction.member as GuildMember).displayName : interaction.user.username) as string,
                        iconURL: interaction.user.avatarURL() ?? undefined,
                    })],
                });
            } else if (buttonId === 'submit') {
                const quiz = getQuizInfo(interaction);

                if (!quiz || quiz.state !== 'start') {
                    await interaction.reply({
                        embeds: [EmbedUtil.error('오류가 발생했습니다.')],
                        ephemeral: true,
                    });
                    return;
                }

                if (quiz) {
                    const user = quiz.users.find(user => user.member.id === interaction.member?.user.id);
                    if (user) {
                        if (user.answer !== '') {
                            await interaction.reply({
                                embeds: [EmbedUtil.warn('이미 제출하셨습니다.')],
                                ephemeral: true,
                            });
                            return;
                        }

                        const modal = new ModalBuilder()
                            .setCustomId(`submit:${quiz.id}`)
                            .setTitle('정답 제출');

                        const textInput = new TextInputBuilder()
                            .setCustomId(`answer:${quiz.id}`)
                            .setLabel(quiz.question)
                            .setPlaceholder("정답을 입력해주세요.")
                            .setMinLength(1)
                            .setMaxLength(100)
                            .setStyle(TextInputStyle.Short);

                        const actionRow = new ActionRowBuilder().addComponents(textInput);

                        // @ts-ignore
                        modal.addComponents(actionRow);

                        await interaction.showModal(modal);
                    } else {
                        await interaction.reply({
                            embeds: [EmbedUtil.error('퀴즈 이벤트에 참가하지 않았습니다.')],
                            ephemeral: true,
                        });
                    }
                } else {
                    await interaction.reply({
                        embeds: [EmbedUtil.error('퀴즈 이벤트가 없습니다.')],
                        ephemeral: true,
                    });
                }
            }
        } else if (interaction.isSelectMenu()) {

        } else if (interaction.isModalSubmit()) {
            const modalId = interaction.customId.split(':')[0];
            if (modalId === 'submit') {
                const quiz = getQuizInfo(interaction);

                if (!quiz || quiz.state !== 'start') {
                    await interaction.reply({
                        embeds: [EmbedUtil.error('오류가 발생했습니다.')],
                        ephemeral: true,
                    });
                    return;
                }

                if (quiz) {
                    const user = quiz.users.find(user => user.member.id === interaction.member?.user.id);
                    if (user) {
                        if (user.answer !== '') {
                            await interaction.reply({
                                embeds: [EmbedUtil.warn('이미 제출하셨습니다.')],
                                ephemeral: true,
                            });
                            return;
                        }

                        const userAnswer = interaction.fields.getTextInputValue(`answer:${quiz.id}`);

                        if (userAnswer) {
                            user.answer = userAnswer;
                            await interaction.reply({
                                embeds: [EmbedUtil.success(
                                    `정답을 제출하였습니다! \n\n 제출한 사람: ${quiz.users.filter(user => user.answer !== '').length} / ${quiz.users.length}`, {
                                        text: (interaction.member ? (interaction.member as GuildMember).displayName : interaction.user.username) as string,
                                        iconURL: interaction.user.avatarURL() ?? undefined,
                                    })],
                            });
                        }
                    } else {
                        await interaction.reply({
                            embeds: [EmbedUtil.error('퀴즈 이벤트에 참가하지 않았습니다.')],
                            ephemeral: true,
                        });
                    }
                } else {
                    await interaction.reply({
                        embeds: [EmbedUtil.error('퀴즈 이벤트가 없습니다.')],
                        ephemeral: true,
                    });
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
});

client.login(Config.token).then(() =>
    console.log('Logged in!')
);
