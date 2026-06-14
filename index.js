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

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const frases = {
  aprovado: [
    (m) => `Que merda, o filha da puta passou... Tua média ficou: **${m}**`,
    (m) => `Ah não mano, a mãe gostosa está aprovada com **${m}** infelizmente`,
    (m) => `Pior notícia da minha vida é que esse otário ficou com **${m}** e foi aprovado, vai tomar no seu cu`,
    (m) => `Inacreditável esse lixo passar com **${m}**... o sistema falhou`,
    (m) => `Eu acredito em milagre não mas esse cuzão tirou **${m}** e passou, que nojo`,
    (m) => `Minha vó tava certa, até macaco digita shakespeare... **${m}** e aprovado esse verme`,
  ],

  reprovado: [
    (as, ap) => `VAMOOOS NÃO PASSOU SEU OTÁRIO, ainda vai ter que tirar **${as}** na AS (vai substituir ${ap})`,
    (as, ap) => `Chupa seu merda, fica de recuperação aí. Ainda tem que tirar **${as}** na AS pra passar (substitui ${ap}).`,
    (as, ap) => `YEAHHHH, tá de recuperação otário, tem que tirar **${as}** na AS pra passar (substitui ${ap}) 😂`,
    (as, ap) => `Isso que dá estudar de véspera seu inútil. **${as}** na AS ou vai chorar pra coordenação (substitui ${ap})`,
    (as, ap) => `Nem surpresa. Agora vai ter que suar na AS: mínimo **${as}** (substitui ${ap}). Boa sorte, vai precisar 🤡`,
    (as, ap) => `Parabéns pelo fracasso! Corre lá tirar **${as}** na AS (substitui ${ap}) antes de desistir da faculdade`,
  ],

  semSaida: [
    (m) => `VAMOOOS NÃO PASSOU SEU OTÁRIO, e olha que nem com 10 na AS tu passa. Máximo que tu chega é **${m}** 💀`,
    (m) => `Chupa seu merda, fica de recuperação aí. E o pior: mesmo tirando 10 na AS tu não passa. Máximo: **${m}**. Fudeu.`,
    (m) => `YEAHHHH, tá de recuperação otário, e nem tem como passar na AS. Máximo possível: **${m}**. Tchau 👋`,
    (m) => `Cara... nem tem o que fazer. Com tudo que podia tirar na AS, o máximo seria **${m}**. Já começa a pensar em trancar 💀`,
    (m) => `Histórico. Nem o Enem salva esse aqui. Máximo possível com AS: **${m}**. Chora`,
    (m) => `Matemática não mente: **${m}** é o teto. Já vai logo na coordenação pedir dependência, seu desastre`,
  ],

  faltaAP: [
    (ap, min) => `Olha esse aqui ainda não fez a ${ap}... Pra não reprovar tu precisa tirar pelo menos **${min}** na ${ap}. Não faz feio`,
    (ap, min) => `${ap} nem fez ainda esse vagabundo. Corre lá tirar **${min}** ou mais, senão tá lascado`,
    (ap, min) => `Eita, nem fez a ${ap} ainda? Tá na mão: precisa de **${min}** pra ter chance de passar. Vai estudar seu inútil`,
    (ap, min) => `Que preguiça de fazer a ${ap}... bom, precisa de **${min}** nela pra sobreviver. Boa sorte (vai precisar)`,
    (ap, min) => `${ap} faltando e já vem calcular? Coragem. Precisa de **${min}** lá. Não aparece com menos não 🙄`,
    (ap, min) => `Sem a ${ap} feita ainda, o mínimo é **${min}**. Abaixo disso vai direto pra AS seu otário`,
  ],

  faltaAPsemSaida: [
    (ap) => `Nem com 10 na ${ap} esse lixo passa. Já cancela a matrícula e vai embora 💀`,
    (ap) => `Cara, mesmo tirando 10 na ${ap} não passa. Isso é talento pra reprovar, respeito 🫡`,
    (ap) => `A ${ap} podia ser 10 e mesmo assim ia reprovar. Impressionante o nível de fracasso`,
  ],
};

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'prova') {
    const modal = new ModalBuilder()
      .setCustomId('modal_prova')
      .setTitle('Calculadora de Média — IBMEC');

    const ap1Input = new TextInputBuilder()
      .setCustomId('ap1')
      .setLabel('Nota da AP1 (0-10) — branco se não fez')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 7.5 — deixe vazio se ainda não fez a AP1')
      .setRequired(false);

    const ap2Input = new TextInputBuilder()
      .setCustomId('ap2')
      .setLabel('Nota da AP2 (0-10) — branco se não fez')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 8.0 — deixe vazio se ainda não fez a AP2')
      .setRequired(false);

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

  if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_prova') {
    const parse = (str) => {
      const s = str.trim().replace(',', '.');
      return s === '' ? null : parseFloat(s);
    };

    const ap1 = parse(interaction.fields.getTextInputValue('ap1'));
    const ap2 = parse(interaction.fields.getTextInputValue('ap2'));
    const ac  = parse(interaction.fields.getTextInputValue('ac'));
    const tpRaw = interaction.fields.getTextInputValue('tp').trim();
    const tp  = tpRaw === '' ? 0 : parseFloat(tpRaw.replace(',', '.'));

    const invalidRange = (v, min, max) => isNaN(v) || v < min || v > max;

    if (ap1 === null && ap2 === null) {
      return interaction.reply({
        content: '❌ Deixa pelo menos uma nota (AP1 ou AP2), seu lerdo.',
        ephemeral: true,
      });
    }
    if (ap1 !== null && invalidRange(ap1, 0, 10)) {
      return interaction.reply({ content: '❌ AP1 tem que ser entre 0 e 10.', ephemeral: true });
    }
    if (ap2 !== null && invalidRange(ap2, 0, 10)) {
      return interaction.reply({ content: '❌ AP2 tem que ser entre 0 e 10.', ephemeral: true });
    }
    if (invalidRange(ac, 0, 10)) {
      return interaction.reply({ content: '❌ AC tem que ser entre 0 e 10.', ephemeral: true });
    }
    if (invalidRange(tp, 0, 1)) {
      return interaction.reply({ content: '❌ Teste de Progresso tem que ser entre 0 e 1.', ephemeral: true });
    }

    const embed = new EmbedBuilder().addFields(
      { name: '📝 AP1', value: ap1 !== null ? ap1.toFixed(1) : '—', inline: true },
      { name: '📝 AP2', value: ap2 !== null ? ap2.toFixed(1) : '—', inline: true },
      { name: '📋 AC',  value: ac.toFixed(1), inline: true },
      { name: '⭐ Teste de Progresso', value: `+${tp.toFixed(1)}`, inline: true },
    );

    // Caso: falta AP1 ou AP2
    if (ap1 === null || ap2 === null) {
      const apFeita      = ap1 !== null ? ap1 : ap2;
      const nomeFeita    = ap1 !== null ? 'AP1' : 'AP2';
      const nomeFaltando = ap1 === null ? 'AP1' : 'AP2';

      // apFeita*0.4 + apFalta*0.4 + ac*0.2 + tp >= 7
      const minFalta = (7 - apFeita * 0.4 - ac * 0.2 - tp) / 0.4;

      embed.addFields({ name: '📊 Situação', value: `${nomeFeita} feita, ${nomeFaltando} pendente`, inline: true });

      if (minFalta > 10) {
        embed
          .setColor(0xed4245)
          .setTitle(`💀 Já era mesmo com a ${nomeFaltando}`)
          .setDescription(pick(frases.faltaAPsemSaida)(nomeFaltando));
      } else {
        const min = Math.max(0, minFalta);
        embed
          .setColor(0xfee75c)
          .setTitle(`⏳ Ainda falta a ${nomeFaltando}`)
          .setDescription(pick(frases.faltaAP)(nomeFaltando, min.toFixed(2)));
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Caso: as duas AP foram feitas
    const media = ap1 * 0.4 + ap2 * 0.4 + ac * 0.2 + tp;
    embed.addFields({ name: '📊 Média Final', value: `**${media.toFixed(2)}**`, inline: true });

    if (media >= 7) {
      embed
        .setColor(0x57f287)
        .setTitle('✅ Aprovado (infelizmente)')
        .setDescription(pick(frases.aprovado)(media.toFixed(2)));
    } else {
      const lowerAP  = Math.min(ap1, ap2);
      const higherAP = Math.max(ap1, ap2);
      const whichAP  = ap1 <= ap2 ? 'AP1' : 'AP2';
      const requiredAS = (7 - higherAP * 0.4 - ac * 0.2 - tp) / 0.4;

      if (requiredAS > 10) {
        const maxMedia = higherAP * 0.4 + 10 * 0.4 + ac * 0.2 + tp;
        embed
          .setColor(0xed4245)
          .setTitle('💀 Reprovado e sem saída')
          .setDescription(pick(frases.semSaida)(maxMedia.toFixed(2)));
      } else {
        const minAS = Math.max(0, requiredAS);
        embed
          .setColor(0xed4245)
          .setTitle('⚠️ Recuperação, seu otário')
          .setDescription(pick(frases.reprovado)(minAS.toFixed(2), whichAP));
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
