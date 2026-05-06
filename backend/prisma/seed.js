import { prisma } from '../src/lib/client.ts';

async function main() {
    await prisma.tier.createMany({
        data: [
            {
                name: 'مبتدئ',
                badgeColor: '#9E9E9E',
                description:
                    'عضو جديد في المجتمع، يبدأ رحلته بمشاركة تجاربه وأسئلته واستكشاف محتوى السفر في الوطن العربي.',
            },
            {
                name: 'مستكشف',
                badgeColor: '#4CAF50',
                description:
                    'عضو نشط يشارك بتجارب ومعلومات مفيدة عن السفر والتنقل والأماكن المميزة داخل الدول العربية.',
            },
            {
                name: 'دليل',
                badgeColor: '#2196F3',
                description:
                    'عضو موثوق يقدّم نصائح قيّمة، يجيب عن الأسئلة، ويساعد الآخرين في التخطيط لرحلاتهم بثقة.',
            },
            {
                name: 'خبير',
                badgeColor: '#FF9800',
                description:
                    'عضو صاحب خبرة واسعة في السفر والسياحة، يشارك محتوى عالي الجودة ويقدّم إرشادات دقيقة ومفيدة للمجتمع.',
            },
            {
                name: 'سفير السفر',
                badgeColor: '#9C27B0',
                description:
                    'عضو مميز يمثل روح المجتمع، يثري المنصة بمحتوى استثنائي وتجارب ملهمة تساعد الآخرين على اكتشاف الوطن العربي.',
            },
            {
                name: 'أسطورة السفر',
                badgeColor: '#FFD700',
                description:
                    'أعلى مراتب المجتمع، تُمنح للأعضاء الأكثر تأثيرًا وإلهامًا، ممن تركوا بصمة واضحة بمحتواهم ومساهماتهم القيّمة.',
            },
        ],
        skipDuplicates: true,
    });

    console.log('(*-*) Tiers seeded!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
