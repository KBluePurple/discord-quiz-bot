import {PermissionFlagsBits, REST, Routes, SlashCommandBuilder} from "discord.js";

const command = [
    new SlashCommandBuilder()
        .setName('퀴즈')
        .setDescription('퀴즈 이벤트 관리자 명령어')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('준비')
                .setDescription('퀴즈 이벤트를 준비합니다.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('시작')
                .setDescription('퀴즈 이벤트를 시작합니다.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('제시')
                .setDescription('퀴즈 이벤트 문제를 제시합니다.')
                .addStringOption(option =>
                    option
                        .setName('문제')
                        .setDescription('문제를 입력해주세요.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("정답")
                        .setDescription("정답을 입력해주세요.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('정답')
                .setDescription('퀴즈 이벤트 정답을 확인합니다.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('랭킹')
                .setDescription('퀴즈 이벤트 점수 랭킹을 확인합니다.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('종료')
                .setDescription('퀴즈 이벤트를 종료합니다.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('초기화')
                .setDescription('퀴즈 이벤트를 초기화합니다.')
        )
]

const rest = new REST({version: '10'}).setToken('MTA0NjY1NDg4NTcxNTc3OTY3NA.GCpFqf.On42xgCtL5P80hlv0XjGQcXIXC1TQzBs52k_aY');

export function registerCommands() {
    (async () => {
        try {
            await rest.put(
                Routes.applicationCommands('1046654885715779674'),
                {body: command},
            );

            console.log('Successfully registered application commands.');
        } catch (error) {
            console.error(error);
        }
    })();
}