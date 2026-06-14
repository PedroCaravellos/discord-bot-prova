const {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  InteractionType,
  EmbedBuilder,
} = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  // Abre o popup ao usar /prova
  if (interaction.isChatInputCommand() && interaction.commandName === 'prova') {
    const modal = new ModalBuilder()
      .setCustomId('modal_prova')
      .setTitle('Calculadora de Média — IBMEC');

    const ap1Input = new TextInputBuilder()
      .setCustomId('ap1')
      .setLabel('Nota da AP1 (0 a 10) — peso 4,0')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 7.5')
      .setRequired(true);

    const ap2Input = new TextInputBuilder()
      .setCustomId('ap2')
      .setLabel('Nota da AP2 (0 a 10) — peso 4,0')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 8.0')
      .setRequired(true);

    const acInput = new TextInputBuilder()
      .setCustomId('ac')
      .setLabel('Nota da AC (0 a 10) — peso 2,0')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 9.0')
      .setRequired(true);

    const tpInput = new TextInputBuilder()
      .setCustomId('tp')
      .setLabel('Teste de Progresso (0 a 1.0) — bônus')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 0.5 — deixe em branco se não fez')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ap1Input),
      new ActionRowBuilder().addComponents(ap2Input),
      new ActionRowBuilder().addComponents(acInput),
      new ActionRowBuilder().addComponents(tpInput),
    );

    await interaction.showModal(modal);
    return;
  }

  // Processa o formulário submetido
  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_prova') {
    const parse = (str) => parseFloat(str.trim().replace(',', '.'));

    const ap1 = parse(interaction.fields.getTextInputValue('ap1'));
    const ap2 = parse(interaction.fields.getTextInputValue('ap2'));
    const ac  = parse(interaction.fields.getTextInputValue('ac'));
    const tpRaw = interaction.fields.getTextInputValue('tp').trim();
    const tp  = tpRaw === '' ? 0 : parse(tpRaw);

    // Validações
    const invalidRange = (v, min, max) => isNaN(v) || v < min || v > max;
    if (invalidRange(ap1, 0, 10) || invalidRange(ap2, 0, 10) || invalidRange(ac, 0, 10)) {
      return interaction.reply({
        content: '❌ AP1, AP2 e AC devem ser números entre **0** e **10**.',
        ephemeral: true,
      });
    }
    if (invalidRange(tp, 0, 1)) {
      return interaction.reply({
        content: '❌ O Teste de Progresso deve ser entre **0** e **1.0**.',
        ephemeral: true,
      });
    }

    // Fórmula: AP1*0.4 + AP2*0.4 + AC*0.2 + TP(bônus)
    const media = ap1 * 0.4 + ap2 * 0.4 + ac * 0.2 + tp;

    const embed = new EmbedBuilder().addFields(
      { name: '📝 AP1', value: ap1.toFixed(1), inline: true },
      { name: '📝 AP2', value: ap2.toFixed(1), inline: true },
      { name: '📋 AC',  value: ac.toFixed(1),  inline: true },
      { name: '⭐ Teste de Progresso', value: `+${tp.toFixed(1)}`, inline: true },
      { name: '📊 Média Final', value: `**${media.toFixed(2)}**`, inline: true },
    );

    if (media >= 7) {
      embed
        .setColor(0x57f287)
        .setTitle('✅ Aprovado!')
        .setDescription(`Sua média é **${media.toFixed(2)}**. Parabéns, você passou! 🎉`);
    } else {
      // AS substitui a menor nota entre AP1 e AP2
      const lowerAP  = Math.min(ap1, ap2);
      const higherAP = Math.max(ap1, ap2);
      const whichAP  = ap1 <= ap2 ? 'AP1' : 'AP2';

      // higherAP*0.4 + AS*0.4 + ac*0.2 + tp >= 7
      const requiredAS = (7 - higherAP * 0.4 - ac * 0.2 - tp) / 0.4;

      embed
        .setColor(0xed4245)
        .setTitle('⚠️ Em Recuperação')
        .setDescription(`Sua média é **${media.toFixed(2)}**. Você precisa fazer a **AS**.`);

      if (requiredAS > 10) {
        const maxMedia = higherAP * 0.4 + 10 * 0.4 + ac * 0.2 + tp;
        embed.addFields({
          name: '😔 Situação crítica',
          value:
            `Mesmo tirando **10** na AS (substituindo ${whichAP}), a maior média possível seria **${maxMedia.toFixed(2)}**.\n` +
            `Infelizmente não é possível atingir 7 nessa situação.`,
        });
      } else {
        const minAS = Math.max(0, requiredAS);
        embed.addFields({
          name: `🎯 Nota mínima na AS`,
          value:
            `Você precisa de pelo menos **${minAS.toFixed(2)}** na AS.\n` +
            `A AS vai substituir sua ${whichAP} (nota atual: **${lowerAP.toFixed(1)}**).`,
        });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
