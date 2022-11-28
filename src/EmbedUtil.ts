import {EmbedAuthorOptions, EmbedBuilder, EmbedFooterOptions} from "discord.js";

function defaultEmbed(message: string, footer: EmbedFooterOptions | undefined = undefined, author: EmbedAuthorOptions | undefined = undefined) {
    return new EmbedBuilder()
        .setDescription(message)
        .setAuthor(author ?? null)
        .setFooter(footer ?? null)
        .setColor('#2f3136')
}

export default {
    info: (message: string, footer: EmbedFooterOptions | undefined = undefined, author: EmbedAuthorOptions | undefined = undefined) => {
        return defaultEmbed(message, footer, author)
    },
    success(message: string, footer: EmbedFooterOptions | undefined = undefined, author: EmbedAuthorOptions | undefined = undefined): EmbedBuilder {
        return defaultEmbed(`✅ ${message}`, footer, author)
    },
    warn(message: string, footer: EmbedFooterOptions | undefined = undefined, author: EmbedAuthorOptions | undefined = undefined): EmbedBuilder {
        return defaultEmbed(`⚠ ${message}`, footer, author)
    },
    error(message: string, footer: EmbedFooterOptions | undefined = undefined, author: EmbedAuthorOptions | undefined = undefined): EmbedBuilder {
        return defaultEmbed(`❌ ${message}`, footer, author)
    }
}