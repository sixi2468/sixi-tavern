/* ===========================================================
   Store —— 本地数据层（演示版）
   真实上线时，把本文件的读写替换成后端 API 即可，
   页面里只调用 Store.xxx()，结构保持不变。
   =========================================================== */
(function () {
  const KEY = 'sixi_v3';
  const DAY = 86400000;

  /* ---------- 默认屏蔽词库 ---------- */
  const BLOCKWORDS = `# 四夕酒馆 · 默认屏蔽词库
# 用法：设置页 → 屏蔽词 → 导入词库（每行一词，# 开头为注释）
# 建议每季度按后台「审核记录」补充一次

## 一、导流与广告
加微信
加威信
加VX
加vx
微信号
私聊我
扫码进群
二维码
代购
刷单
返利
兼职日结
日赚
月入过万
躺赚
引流
推广软件
免费领取
点击链接
复制口令
淘口令
优惠券群
内部渠道
一手货源

## 二、辱骂与人身攻击
傻逼
傻B
煞笔
脑残
智障
弱智
废柴
垃圾人
去死
滚出去
狗东西
贱人
杂种
王八蛋
你妈的
草泥马
nmsl
cnm
sb
滚蛋
有病吧

## 三、色情与低俗擦边
约炮
裸聊
一夜情
黄片
成人视频
福利姬
楼凤
包养
老司机带路
成人网站
色情
情色

## 四、赌博与诈骗
博彩
赌博
时时彩
六合彩
百家乐
棋牌室
洗钱
杀猪盘
资金盘
高回报
稳赚不赔
内部消息
荐股
代开发票
办证
贷款秒批
无抵押
刷流水

## 五、违禁与危险品
枪支
弹药
毒品
冰毒
大麻
迷药
窃听器
办假证
假身份证
代考
论文代写
黑客接单
破解版
外挂
私服

## 六、擦边引流与私域
V信
v信
薇信
加我
私我
滴滴我
主页有
看我简介
进主页
扣1
扣一
懂的都懂
资源分享
福利群
内部群
免费送
0元购
秒杀
代下单
代写
代运营
接单
接稿

## 七、其它常见违规
传销
拉人头
原始股
虚拟币
炒币
挖矿
跑分
洗白
水军
控评
刷量
买赞
买粉
人肉
开盒
诈骗
骗钱
套路贷
裸贷
高利贷

## 八、站内自定义（可自行增删）
四夕酒馆官方
馆主私人
内部优惠
`;

  /* ---------- 小工具 ---------- */
  const uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9);
  const now = () => Date.now();
  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return 'h' + (h >>> 0).toString(36);
  }

  /* ---------- 种子数据 ---------- */
  const COVERS = [
    ['#3c4f47', '#26332f'], ['#4a3b33', '#2f2621'], ['#3f4457', '#282c3b'],
    ['#5a4436', '#3a2c23'], ['#42564f', '#2a3833'], ['#4b3f52', '#2f2834'],
  ];

  const BOOK_SEED = [
    { t: '山月记', a: '中岛敦', p: '广西师范大学出版社', isbn: '9787559817308', cat: '小说' },
    { t: '我们仨', a: '杨绛', p: '生活·读书·新知三联书店', isbn: '9787108015309', cat: '散文' },
    { t: '万历十五年', a: '黄仁宇', p: '中华书局', isbn: '9787101140749', cat: '历史' },
    { t: '人间词话', a: '王国维', p: '上海古籍出版社', isbn: '9787532582347', cat: '诗话' },
    { t: '陶庵梦忆', a: '张岱', p: '中华书局', isbn: '9787101141906', cat: '散文' },
    { t: '世说新语', a: '刘义庆', p: '中华书局', isbn: '9787101144495', cat: '笔记' },
    { t: '夜航西飞', a: '柏瑞尔·马卡姆', p: '人民文学出版社', isbn: '9787020161504', cat: '传记' },
    { t: '月亮与六便士', a: '毛姆', p: '上海译文出版社', isbn: '9787532781780', cat: '小说' },
    { t: '寂静的春天', a: '蕾切尔·卡逊', p: '上海译文出版社', isbn: '9787532777262', cat: '科学' },
    { t: '枪炮、病菌与钢铁', a: '贾雷德·戴蒙德', p: '上海译文出版社', isbn: '9787532775268', cat: '历史' },
    { t: '美的历程', a: '李泽厚', p: '生活·读书·新知三联书店', isbn: '9787108063218', cat: '美学' },
    { t: '诗经', a: '佚名', p: '中华书局', isbn: '9787101144846', cat: '诗话' },
  ];

  const NOTE_SEED = [
    {
      bi: 0, title: '我惧怕的，是自己并非美玉',
      body: `读《山月记》，最震动我的不是李征化为虎的那一夜，而是他化虎之前那段日子：既不肯与瓦砾为伍，又不肯刻苦琢磨，于是日渐孤僻，终于被自己的犹疑吞掉。

> 因为害怕自己并非明珠而不敢刻苦琢磨，又因为有几分相信自己是明珠，而不能与瓦砾碌碌为伍。

这句话像一根细针，扎在很多个夜里。我们大多数人的困境并不是没有才华，而是才华不够确定，于是既不敢全力以赴，也不甘心就此放下。悬在半空，最耗人。

后来想，或许解法不在"确认自己是不是美玉"，而在"先琢磨起来"。玉石在被雕之前，谁也不知道里面是什么。手停下来，答案就永远悬着。

张岱说"人无癖不可与交，以其无深情也"。我想改一个字：人无癖不可与交，以其不肯琢磨也。`,
      tags: ['小说', '自我', '中岛敦'], vis: 'public', like: 128,
    },
    {
      bi: 1, title: '我们仨，走散在古驿道上',
      body: `杨绛写梦，写得很轻。"我们仨"失散了，她把一场漫长的告别，写成了一条古驿道上的同行与失散。

最难忘的是那句：世间好物不坚牢，彩云易散琉璃脆。她并不哀嚎，只是把日子一件件摆出来：钟书煮的"五分钟蛋"，圆圆画的画，三里河的寓所，窗外的榆树。

> 我一个人，怀念我们仨。

读到这里才明白，所谓相守，不过是把极平常的日子过得认真。等到只剩一个人，那些平常便成了全部的家当。

合上书，我给家里打了个电话，没什么事，只是问了问晚饭吃了什么。`,
      tags: ['散文', '家', '告别'], vis: 'public', like: 96,
    },
    {
      bi: 2, title: '万历十五年：一个朝代的慢性病',
      body: `黄仁宇把 1587 年单独拎出来，说这一年"表面上似乎并无大事"，实则种种症结已经养成。这个写法很像医生看诊：不看你今天有没有发烧，而看你过去二十年的作息。

万历从勤政到怠政，并非单纯的懒惰；申时行在文官集团的夹缝里和稀泥；海瑞以道德为刀，刀刃向内也向外；戚继光在制度之外另起炉灶，人一走，炉灶就散了。

> 一项政策能否贯彻，全看它能否与文官集团的共同习惯相吻合。

制度的病，往往不是坏人在作恶，而是一群不算坏的人，按着各自的道理，把船一点点推向礁石。读史的意义大概在此：看见结构，才不至于只骂人。`,
      tags: ['历史', '制度', '明史'], vis: 'public', like: 74,
    },
    {
      bi: 3, title: '境界：从"昨夜西风"到"灯火阑珊"',
      body: `王国维借三句词说治学三境，其实也是做人三境。

第一境"昨夜西风凋碧树，独上高楼，望尽天涯路"，是立志，是先把世界看清楚，也是先把孤独认下来。
第二境"衣带渐宽终不悔，为伊消得人憔悴"，是苦功。没有这一层，前面的登高只是空望。
第三境"众里寻他千百度，蓦然回首，那人却在灯火阑珊处"，是豁然。可豁然之前，必须真的寻过千百度。

> 词以境界为最上。有境界则自成高格，自有名句。

我从前喜欢第三境，觉得它轻盈。现在更敬第二境：肯为一个不一定有回报的东西，把自己耗进去几年。这件事本身就有境界。`,
      tags: ['诗话', '治学', '王国维'], vis: 'public', like: 152,
    },
    {
      bi: 4, title: '张岱的雪，下了四百年',
      body: `"崇祯五年十二月，余住西湖。大雪三日，湖中人鸟声俱绝。"

二十个字，气温就降下来了。张岱写雪，不写雪，写的是"声俱绝"之后那种空。

> 雾凇沆砀，天与云与山与水，上下一白。湖上影子，惟长堤一痕、湖心亭一点、与余舟一芥、舟中人两三粒而已。

"一痕""一点""一芥""两三粒"——量词用得极准，人在这天地间，确实只有这么点大。可他不因此悲观，反倒兴冲冲去湖心亭看雪，遇上同样痴的两个人，强饮三大白而别。

明亡之后他写这些，是隔着废墟回望。那一场雪于是不只是雪，是一个再也回不去的好时光。`,
      tags: ['散文', '晚明', '张岱'], vis: 'public', like: 210,
    },
    {
      bi: 5, title: '《世说》里的人都活得好用力',
      body: `魏晋人常被说成清谈、放达，可读《世说新语》读久了，会觉得他们其实活得很用力，只是用力之处与今人不同。

王子猷雪夜访戴，到了门口却折返，说"乘兴而行，兴尽而返，何必见戴"。这不是懒，这是把"兴"看得比"结果"重。

> 我与我周旋久，宁作我。

殷浩这句话，我抄在扉页上很久。人一生最难的，大概不是胜过别人，而是与自己周旋到和解，最后承认：算了，我就做我吧。

书名"新语"，新在一份不肯被规矩磨平的鲜活。`,
      tags: ['笔记', '魏晋', '人物'], vis: 'followers', like: 63,
    },
    {
      bi: 6, title: '夜航西飞：一个人如何独自辽阔',
      body: `柏瑞尔在非洲长大，独自驾机横越大西洋。她写飞行，写得像呼吸一样自然。

> 我学会了如果你必须离开一个地方，一个你曾经住过、爱过、深埋着你所有过往的地方，无论以何种方式离开，都不要慢慢离开，要尽你所能决绝地离开。

这句话读来发冷，也发亮。她的孤独不是被抛弃的那种，是主动选择的辽阔。一个人在机舱里，下面是海，上面是星，没有人可以商量。

我合上书想：我们未必都要去横渡大洋，但总该有一段路，是自己一个人走完的。`,
      tags: ['传记', '飞行', '孤独'], vis: 'public', like: 88,
    },
    {
      bi: 7, title: '月亮与六便士：他抛下的不是妻子，是体面',
      body: `很多人把这本书读成一个"追梦"的故事，我更愿意读成一次对体面的叛逃。

思特里克兰德四十岁那年突然走了，留下一张字条，去画画。他不是不爱妻子，他是忽然无法再忍受那种被安排得妥妥帖帖的生活。

> 我总觉得大多数人这样度过一生好像欠缺一点什么。我承认这种生活的社会价值，也看到了它的井然有序的幸福，但是我的血液里却有一种强烈的愿望，渴望一种更狂放不羁的旅途。

毛姆没有把他写成英雄。他自私、粗鲁、伤害了所有靠近他的人。可你没法不承认：这个人至少活得诚实。

我不打算学他，但我记住了那个问题——你手里捡的六便士，是不是你真正想要的？`,
      tags: ['小说', '选择', '毛姆'], vis: 'public', like: 176,
    },
    {
      bi: 8, title: '寂静的春天，其实是喧闹的控诉',
      body: `六十多年过去，这本书读起来依然不安。

卡逊没有一上来就喊口号，她先讲了一个美国小镇：春天来了，鸟不叫了，孩子在院子里玩，忽然倒下。然后她一层层拆开：DDT 如何在食物链里富集，如何杀死昆虫也杀死鸟，如何让害虫更快地产生抗性。

> 控制自然这个词，是一个妄自尊大的产物。

这句话如今听来像预言。我们总以为自己在管理自然，其实只是把自己也放进了那张网里。`,
      tags: ['科学', '环境', '生态'], vis: 'public', like: 59,
    },
  ];

  const OTHER_BOOKS = [
    ['雪国', '川端康成', '南海出版公司', '9787544292333'],
    ['局外人', '加缪', '上海译文出版社', '9787532776771'],
    ['边城', '沈从文', '北岳文艺出版社', '9787537852186'],
    ['东坡志林', '苏轼', '中华书局', '9787101143887'],
    ['长物志', '文震亨', '中华书局', '9787101139675'],
    ['瓦尔登湖', '梭罗', '上海译文出版社', '9787532774012'],
    ['东京梦华录', '孟元老', '中华书局', '9787101138883'],
    ['卡拉马佐夫兄弟', '陀思妥耶夫斯基', '上海译文出版社', '9787532780202'],
    ['小径分岔的花园', '博尔赫斯', '上海译文出版社', '9787532778997'],
    ['诗经名物图解', '细井徇', '中华书局', '9787101129454'],
  ];

  const FEED_TITLES = [
    ['雪落无声，人心有声', '川端康成把"徒劳"写成了美。驹子明知一切终将白费，还是每天把琴擦亮。'],
    ['在局外的人，也在场', '默尔索的冷漠不是无情，是他拒绝表演。'],
    ['边城的渡口，渡的是人还是时间', '翠翠等的也许不是傩送，是一个不会再来的时代。'],
    ['读东坡，学他怎么把日子过下去', '黄州、惠州、儋州，一次比一次远，文章一次比一次松快。'],
    ['长物志：明代人的精致生活指南', '文震亨嫌弃的病，正是今天很多人追的时髦。'],
    ['瓦尔登湖边的两年，够不够看清一生', '梭罗在湖边不是为了逃离，是为了做一次生活实验。'],
    ['东京梦华录里的夜市', '把一座城的烟火气，细细记成书。'],
    ['卡拉马佐夫：谁来回答"如果上帝不存在"', '陀思妥耶夫斯基把问题推到极端，然后交给人自己。'],
    ['博尔赫斯的图书馆没有尽头', '每一条小径都通向另一本书。'],
    ['《诗经》里的草木都认得', '细井徇画了三百种草木虫鱼，替我们补上名与物之间的空隙。'],
  ];

  const FILLERS = [
    '读的时候在页边写了不少字，回头整理成这篇。书上说的是别人的事，落在心里却是自己的。',
    '这一页我读了三遍，还是觉得没有读透。先记下来，等过些日子再来看。\n\n有些句子像酒，要放一放才出味。',
    '夜里读到这一段，窗外的车声都退远了。好的文字大概就是这样，把人从当下的地方轻轻提起来。',
    '我把它抄在笔记本的扉页上，抄完才发现，纸已经被笔尖压出了印子。',
    '多年前读过一次，那时只觉得好；如今再读，才知道好在哪里。人是要长到某个年纪，才配读某些书的。',
    '书里的世界并不比现实更宽，但它给你一个站得高一点的地方，往下看。',
    '合上书时天已经蒙蒙亮。我没有立刻睡，坐在窗边把这个念头又过了一遍。',
  ];

  const USERS_SEED = [
    ['江照月', 'jzym@sixi.art', '1993-11-02', '读书如饮酒，宜慢。'],
    ['陆停云', 'lty@sixi.art', '1990-06-18', '住在城西，喜欢旧版书。'],
    ['顾青梧', 'gqw@sixi.art', '1999-01-27', '一页一页，把日子读薄。'],
    ['白露', 'bailu@sixi.art', '1995-09-09', '不写读后感，只写读书时的天气。'],
    ['温酒', 'wenjiu@sixi.art', '1992-03-30', '温一壶酒，翻半卷书。'],
  ];

  const COMMENT_SEED = [
    ['这段写得真好，尤其喜欢"先琢磨起来"那句。', true, 24],
    ['同感。我也是读到这一句才停下来。', false, 17],
    ['已经下单了，谢谢馆友推荐。', false, 6],
    ['不太同意，不过佩服这种诚实的写法。', true, 11],
    ['茶已备好，下次一起读。', false, 3],
    ['《世说》我也在读，王子猷那一则总是最击中我。', false, 9],
  ];

  /* ---------- 初始库 ---------- */
  function buildSeed() {
    const t0 = now();

    // 正式上线时可开启 emptySeed：不预置任何示例书与人，第一位访客自己注册
    if (window.SIXI_CONFIG && window.SIXI_CONFIG.emptySeed) {
      return {
        version: 3,
        users: [],
        session: null,
        categories: [],
        books: [],
        notes: [],
        comments: [],
        follows: [],
        blockwords: BLOCKWORDS,
        feedback: [],
        events: [],
        wallets: {},
        adSlots: [
          { id: 'tavern-feed-1', name: '酒肆信息流 · 第 6 位卡片下方', enabled: true, code: '' },
          { id: 'note-bottom-1', name: '笔记详情 · 正文底部横幅', enabled: true, code: '' },
          { id: 'note-side-1', name: '笔记详情 · 右侧栏底部', enabled: true, code: '' },
        ],
        settings: { defaultVisibility: 'public', defaultAnon: false, reviewAutoPass: true },
      };
    }
    const db = {
      version: 3,
      users: [],
      session: null,
      categories: [],
      books: [],
      notes: [],
      comments: [],
      follows: [],
      blockwords: BLOCKWORDS,
      feedback: [],
      events: [],
      wallets: {},
      adSlots: [
        { id: 'tavern-feed-1', name: '酒肆信息流 · 第 6 位卡片下方', enabled: true, code: '' },
        { id: 'note-bottom-1', name: '笔记详情 · 正文底部横幅', enabled: true, code: '' },
        { id: 'note-side-1', name: '笔记详情 · 右侧栏底部', enabled: true, code: '' },
      ],
      settings: { defaultVisibility: 'public', defaultAnon: false, reviewAutoPass: true },
    };

    const owner = {
      id: 'u_owner', email: 'owner@sixi.art', pass: hash('123456'), username: '馆主',
      birthday: '1990-01-01', signature: '四夕酒馆，开门营业。', role: 'owner',
      createdAt: t0 - 220 * DAY,
    };
    const me = {
      id: 'u_me', email: 'demo@sixi.art', pass: hash('123456'), username: '沈砚',
      birthday: '1996-04-12', signature: '半榻茶烟，一窗明月。', role: 'user',
      createdAt: t0 - 96 * DAY,
    };
    db.users.push(owner, me);

    USERS_SEED.forEach(([name, mail, bd, sig], i) => {
      db.users.push({
        id: 'u' + (i + 2), email: mail, pass: hash('123456'), username: name,
        birthday: bd, signature: sig, role: 'user', createdAt: t0 - (60 - i * 7) * DAY,
      });
    });

    ['小说', '散文', '历史', '诗话', '笔记', '传记', '科学', '美学'].forEach((n, i) => {
      db.categories.push({ id: 'c' + (i + 1), userId: me.id, name: n, order: i });
    });

    let bn = 0;
    BOOK_SEED.forEach((b, i) => {
      const cat = db.categories.find((c) => c.name === b.cat);
      db.books.push({
        id: 'b' + (++bn), userId: me.id, title: b.t, author: b.a, publisher: b.p,
        isbn: b.isbn, categoryId: cat ? cat.id : null, cover: null,
        color: i % COVERS.length, createdAt: t0 - (90 - i * 6) * DAY,
      });
    });

    NOTE_SEED.forEach((n, i) => {
      const book = db.books[n.bi];
      db.notes.push({
        id: 'n' + (i + 1), userId: me.id, bookId: book.id, title: n.title,
        content: n.body, visibility: n.vis, anonymous: i === 5,
        status: 'published', tags: n.tags,
        likes: Array.from({ length: 0 }, () => ''),
        likeCount: n.like,
        tipped: 12 + ((i * 7) % 40),
        createdAt: t0 - (72 - i * 5) * DAY,
        publishedAt: t0 - (72 - i * 5) * DAY,
      });
    });

    /* 别人的书与笔记（酒肆内容） */
    const otherCats = ['小说', '散文', '历史', '笔记'];
    otherCats.forEach((n, i) => {
      if (!db.categories.find((c) => c.name === n)) {
        db.categories.push({ id: 'c' + (20 + i), userId: me.id, name: n, order: 8 + i });
      }
    });

    let oid = 0;
    db.users.filter((u) => u.role === 'user' && u.id !== me.id).forEach((u, ui) => {
      OTHER_BOOKS.slice(ui * 2, ui * 2 + 2).forEach(([t, a, p, isbn], k) => {
        const bid = 'ob' + (++oid);
        db.books.push({
          id: bid, userId: u.id, title: t, author: a, publisher: p, isbn,
          categoryId: null, cover: null, color: (ui + k) % COVERS.length,
          createdAt: t0 - (50 - ui * 3) * DAY,
        });
        const idx = (ui * 2 + k) % FEED_TITLES.length;  // 与 OTHER_BOOKS 同序，书与笔记标题对得上
        const [tt, ex] = FEED_TITLES[idx];
        const nid = 'on' + oid;
        db.notes.push({
          id: nid, userId: u.id, bookId: bid, title: tt,
          content: ex + '\n\n' + FILLERS[(ui * 2 + k) % FILLERS.length],
          visibility: 'public', anonymous: (ui + k) % 4 === 0, status: 'published',
          tags: [t.slice(0, 2), a],
          likes: [], likeCount: 12 + ((ui * 37 + k * 53) % 240),
          tipped: (ui * 13 + k * 7) % 60,
          createdAt: t0 - ((ui * 2 + k) * 3 + 1) * DAY,
          publishedAt: t0 - ((ui * 2 + k) * 3 + 1) * DAY,
        });

        if (k === 0) {
          COMMENT_SEED.slice(0, 2 + (ui % 3)).forEach(([c, anon, lk], ci) => {
            const cu = db.users[(ui + ci + 2) % db.users.length];
            db.comments.push({
              id: 'cm' + nid + ci, noteId: nid, userId: cu.id, content: c,
              anonymous: anon, likeCount: lk, likes: [], status: 'published',
              createdAt: t0 - (2 + ci) * DAY,
            });
          });
        }
      });
    });

    /* 与"我"的书同 ISBN 的另一本（演示同书聚合） */
    const dup = db.books.find((b) => b.isbn === '9787101141906');
    if (dup) {
      const u = db.users[3];
      db.books.push({
        id: 'ob_dup', userId: u.id, title: '陶庵梦忆', author: '张岱', publisher: '中华书局',
        isbn: dup.isbn, categoryId: null, cover: null, color: 4,
        createdAt: t0 - 30 * DAY,
      });
      db.notes.push({
        id: 'on_dup', userId: u.id, bookId: 'ob_dup', title: '湖心亭那一场雪，我也在场',
        content: '同读《陶庵梦忆》，我偏爱《湖心亭看雪》这一篇。\n\n张岱写雪，只用"上下一白"四字，却叫人觉得天地都空了。后面"一痕、一点、一芥、两三粒"，越写越小，人就越显得孤。\n\n可他偏偏在这孤里遇到知己，强饮三大白。孤独里忽然有了暖意，这才是最动人的地方。',
        visibility: 'public', anonymous: false, status: 'published',
        tags: ['晚明', '雪'], likes: [], likeCount: 87, tipped: 21,
        createdAt: t0 - 6 * DAY, publishedAt: t0 - 6 * DAY,
      });
    }

    /* 演示账号的酒钱账本 */
    db.wallets[me.id] = {
      balance: 5, received: 3, lastGrant: '',
      ledger: [
        { id: 'lg_seed3', ts: t0 - 1 * DAY, type: 'daily', amount: 3, desc: '每日登录赠酒' },
        { id: 'lg_seed2', ts: t0 - 2 * DAY, type: 'tip_out', amount: -1, desc: '当赏《世说新语》' },
        { id: 'lg_seed1', ts: t0 - 3 * DAY, type: 'tip_in', amount: 1, desc: '被赏满 5 壶折算' },
      ],
    };

    /* 关注关系 */
    db.follows.push({ from: me.id, to: 'u2' }, { from: me.id, to: 'u3' }, { from: me.id, to: 'u5' });

    /* 更多注册用户（让后台数据接近真实体量） */
    const FAMILY = ['林', '陈', '苏', '叶', '周', '许', '何', '秦', '温', '裴', '谢', '沈', '顾', '江', '陆', '白', '程', '夏'];
    const GIVEN = ['之遥', '砚秋', '南枝', '听雨', '望舒', '知白', '怀瑾', '未晞', '清和', '素心', '亦舟', '拾光',
      '照野', '无恙', '有风', '半山', '秋池', '言蹊', '木樨', '照棠', '长夏', '临安', '子夜'];
    for (let i = 0; i < 118; i++) {
      const name = FAMILY[i % FAMILY.length] + GIVEN[(i * 5) % GIVEN.length];
      db.users.push({
        id: 'ug' + i, email: 'reader' + i + '@sixi.art', pass: hash('123456'),
        username: name, birthday: '', signature: '', role: 'user',
        createdAt: t0 - (400 - i * 2) * DAY,
      });
    }

    /* 近 30 天访问事件（后台演示数据） */
    for (let d = 29; d >= 0; d--) {
      const activeCount = 34 + Math.round(14 * Math.sin(d / 2.6)) + (d < 7 ? 12 : 0);
      const pool = db.users.slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      pool.slice(0, Math.min(activeCount, pool.length)).forEach((u, k) => {
        db.events.push({
          userId: u.id, type: 'visit', ts: t0 - d * DAY - (k % 18) * 1800000 - Math.floor(Math.random() * 60) * 60000,
          stay: 90 + Math.floor(Math.random() * 1500),
        });
      });
    }

    /* 一条待审核内容，方便看后台 */
    db.notes.push({
      id: 'n_pending', userId: 'u4', bookId: db.books[1].id, title: '深夜读书，顺手推个好东西',
      content: '这本书真不错，需要电子版的加微信 xxx 免费领取，还有内部渠道优惠。',
      visibility: 'public', anonymous: true, status: 'pending',
      tags: ['随笔'], likes: [], likeCount: 0, tipped: 0,
      createdAt: t0 - 2 * 3600 * 1000, publishedAt: null,
    });

    return db;
  }

  /* ---------- 读写 ---------- */
  let db = null;
  function load() {
    if (db) return db;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        db = JSON.parse(raw);
        if (!db || db.version !== 3) db = buildSeed();
        if (db.adSlots) db.adSlots = db.adSlots.filter((x) => x.id !== 'share-card-1');
      } else {
        db = buildSeed();
        save();
      }
    } catch (e) {
      db = buildSeed();
    }
    return db;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  function reset() {
    db = buildSeed();
    save();
  }

  /* ---------- 频率限制（本机层面的基础防护） ---------- */
  const RL_KEY = 'sixi_rl';
  function rlLoad() {
    try { return JSON.parse(localStorage.getItem(RL_KEY)) || {}; } catch (e) { return {}; }
  }
  function rlSave(o) { try { localStorage.setItem(RL_KEY, JSON.stringify(o)); } catch (e) {} }
  function within(list, ms) {
    const t = now();
    return (list || []).filter((x) => t - x < ms);
  }
  function checkSignup() {
    const rl = rlLoad();
    const day = within(rl.signups, 86400000);
    if (day.length >= 5) {
      return { ok: false, msg: '这台设备今天注册的账号太多了（上限 5 个），明天再来吧' };
    }
    return { ok: true };
  }
  function recordSignup() {
    const rl = rlLoad();
    rl.signups = within(rl.signups, 86400000);
    rl.signups.push(now());
    rlSave(rl);
  }
  function checkLogin(email) {
    const rl = rlLoad();
    const rec = (rl.login || {})[email];
    if (rec && rec.count >= 5) {
      const left = Math.ceil((600000 - (now() - rec.ts)) / 1000);
      if (left > 0) return { ok: false, msg: '试错次数太多，请 ' + left + ' 秒后再试' };
    }
    return { ok: true };
  }
  function recordLoginFail(email) {
    const rl = rlLoad();
    rl.login = rl.login || {};
    const rec = rl.login[email];
    if (!rec || now() - rec.ts > 600000) rl.login[email] = { count: 1, ts: now() };
    else { rec.count += 1; rec.ts = now(); }
    rlSave(rl);
  }
  function clearLoginFail(email) {
    const rl = rlLoad();
    if (rl.login) { delete rl.login[email]; rlSave(rl); }
  }
  function checkPost(kind) {
    const rl = rlLoad();
    rl.posts = rl.posts || { note: [], comment: [] };
    const arr = rl.posts[kind] || [];
    // 允许短时间连发 3 条；超过后要求间隔
    const burst = arr.filter((t) => now() - t < 60000).length;
    const gap = kind === 'note' ? 20000 : 6000;
    const last = arr[arr.length - 1];
    if (burst >= 3 && last && now() - last < gap) {
      return { ok: false, msg: '发得太快了，' + Math.ceil((gap - (now() - last)) / 1000) + ' 秒后再试' };
    }
    const day = within(arr, 86400000);
    const cap = kind === 'note' ? 20 : 100;
    if (day.length >= cap) return { ok: false, msg: '今天发得够多了，明天再来' };
    return { ok: true };
  }
  function recordPost(kind) {
    const rl = rlLoad();
    rl.posts = rl.posts || { note: [], comment: [] };
    rl.posts[kind] = within(rl.posts[kind], 86400000);
    rl.posts[kind].push(now());
    rlSave(rl);
  }

  /* ---------- 用户 ---------- */
  function currentUser() {
    const d = load();
    return d.users.find((u) => u.id === d.session) || null;
  }
  function login(email, pass) {
    const lock = checkLogin(String(email).trim().toLowerCase());
    if (!lock.ok) return { ok: false, msg: lock.msg };
    const d = load();
    const u = d.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!u) return { ok: false, msg: '这个邮箱还没有在酒馆登记过' };
    if (u.pass !== hash(pass)) {
      recordLoginFail(String(email).trim().toLowerCase());
      return { ok: false, msg: '密码不对，再想一想' };
    }
    clearLoginFail(String(email).trim().toLowerCase());
    d.session = u.id;
    d.events.push({ userId: u.id, type: 'visit', ts: now(), stay: 0 });
    save();
    grantDaily(u.id);
    return { ok: true, user: u, daily: { amount: DAILY_WINE } };
  }
  function register({ email, pass, username, birthday, signature }) {
    const gate = checkSignup();
    if (!gate.ok) return gate;
    const d = load();
    email = String(email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, msg: '邮箱格式好像不太对' };
    if (d.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, msg: '这个邮箱已经注册过了' };
    if (!username || username.trim().length < 2) return { ok: false, msg: '用户名至少两个字' };
    const nameHits = moderate(username);
    if (nameHits.length) return { ok: false, msg: '这个名字里有不适合的词，换一个吧' };
    if (d.users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      return { ok: false, msg: '这个名字已经有人用了，换一个吧' };
    }
    if (String(pass).length < 6) return { ok: false, msg: '密码至少 6 位' };
    const ownerMail = (window.SIXI_CONFIG && window.SIXI_CONFIG.ownerEmail || '').toLowerCase();
    const hasOwner = d.users.some((x) => x.role === 'owner');
    const u = {
      id: uid('u'), email, pass: hash(pass), username: username.trim(),
      birthday: birthday || '', signature: signature || '',
      // 指定了馆主邮箱则按邮箱判定；否则第一个注册的人成为馆主
      role: (ownerMail ? email.toLowerCase() === ownerMail : !hasOwner) ? 'owner' : 'user',
      createdAt: now(),
    };
    d.users.push(u);
    d.session = u.id;
    ['未分类'].forEach((n, i) => d.categories.push({ id: uid('c'), userId: u.id, name: n, order: i }));
    d.events.push({ userId: u.id, type: 'visit', ts: now(), stay: 0 });
    save();
    recordSignup();
    grantDaily(u.id);
    return { ok: true, user: u };
  }
  function guest() {
    const d = load();
    d.session = 'u_me';
    save();
    grantDaily('u_me');
    return d.users.find((u) => u.id === 'u_me');
  }
  function logout() { const d = load(); d.session = null; save(); }
  function updateUser(patch) {
    const u = currentUser(); if (!u) return;
    const d = load();
    if (patch.username) {
      const name = String(patch.username).trim();
      if (name.length < 2) return { ok: false, msg: '用户名至少两个字' };
      const hits = moderate(name);
      if (hits.length) return { ok: false, msg: '这个名字里有不适合的词，换一个吧' };
      if (d.users.some((x) => x.id !== u.id && x.username.toLowerCase() === name.toLowerCase())) {
        return { ok: false, msg: '这个名字已经有人用了' };
      }
      patch.username = name;
    }
    Object.assign(u, patch); save();
    return { ok: true };
  }

  /* ---------- 酒钱（每日赠酒 / 当赏） ---------- */
  const DAILY_WINE = 3;        // 每日登录赠 3 壶
  const TIP_COST = 1;          // 每次当赏 1 壶
  const TIP_SHARE = 5;         // 被赏满 5 壶，作者得 1 壶

  function todayKey(ts) {
    const d = new Date(ts || now());
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function walletOf(userId) {
    const d = load();
    if (!d.wallets) d.wallets = {};
    if (!d.wallets[userId]) {
      d.wallets[userId] = { balance: 0, received: 0, lastGrant: '', ledger: [] };
    }
    const w = d.wallets[userId];
    if (!Array.isArray(w.ledger)) w.ledger = [];
    return w;
  }
  function addLedger(w, entry) {
    w.ledger.unshift({ id: uid('lg'), ts: now(), ...entry });
    if (w.ledger.length > 200) w.ledger.length = 200;
  }
  function grantDaily(userId) {
    const d = load();
    const w = walletOf(userId);
    const k = todayKey();
    if (w.lastGrant === k) return { granted: false, balance: w.balance };
    w.lastGrant = k;
    w.balance += DAILY_WINE;
    addLedger(w, { type: 'daily', amount: DAILY_WINE, desc: '每日登录赠酒' });
    save();
    return { granted: true, amount: DAILY_WINE, balance: w.balance };
  }
  function wallet() {
    const u = currentUser();
    if (!u) return { balance: 0, received: 0, ledger: [], todayGranted: false };
    const w = walletOf(u.id);
    return {
      balance: w.balance,
      received: w.received || 0,
      ledger: w.ledger.slice(),
      todayGranted: w.lastGrant === todayKey(),
      daily: DAILY_WINE,
      tipCost: TIP_COST,
      share: TIP_SHARE,
    };
  }

  /* ---------- 热度权重 ---------- */
  // 1 赞 = 1 分，1 壶酒 = 3 分，1 条评论 = 2 分；匿名内容整体 ×2/3
  const W_LIKE = 1, W_TIP = 3, W_COMMENT = 2, ANON_FACTOR = 2 / 3;
  function hotScore(n) {
    const base = (n.likeCount || 0) * W_LIKE + (n.tipped || 0) * W_TIP + (n.commentCount || 0) * W_COMMENT;
    return n.anonymous ? base * ANON_FACTOR : base;
  }

  /* ---------- 分类 ---------- */
  function categories(userId) {
    const d = load();
    const mine = d.books.filter((b) => b.userId === userId);
    return d.categories.filter((c) => c.userId === userId).sort((a, b) => a.order - b.order)
      .map((c) => ({ ...c, count: mine.filter((b) => b.categoryId === c.id).length }));
  }
  function addCategory(name) {
    const d = load(); const u = currentUser(); if (!u) return null;
    const c = { id: uid('c'), userId: u.id, name: name.trim(), order: d.categories.length };
    d.categories.push(c); save(); return c;
  }
  function renameCategory(id, name) {
    const d = load(); const c = d.categories.find((x) => x.id === id);
    if (c) { c.name = name.trim(); save(); }
  }
  function normalizeCategories(userId) {
    const d = load();
    d.categories.filter((c) => c.userId === userId)
      .sort((a, b) => a.order - b.order)
      .forEach((c, i) => { c.order = i; });
  }
  function moveCategory(id, dir) {
    const d = load(); const u = currentUser(); if (!u) return;
    const list = d.categories.filter((c) => c.userId === u.id).sort((a, b) => a.order - b.order);
    const i = list.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i].order, list[j].order] = [list[j].order, list[i].order];
    save();
  }
  function reorderCategories(ids) {
    const d = load(); const u = currentUser(); if (!u) return;
    ids.forEach((id, i) => {
      const c = d.categories.find((x) => x.id === id && x.userId === u.id);
      if (c) c.order = i;
    });
    normalizeCategories(u.id);
    save();
  }
  function removeCategory(id) {
    const d = load();
    d.categories = d.categories.filter((c) => c.id !== id);
    d.books.forEach((b) => { if (b.categoryId === id) b.categoryId = null; });
    save();
  }

  /* ---------- 书籍 ---------- */
  function books(userId) {
    const d = load();
    return d.books.filter((b) => b.userId === userId)
      .map((b) => ({ ...b, noteCount: d.notes.filter((n) => n.bookId === b.id).length }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  function book(id) { return load().books.find((b) => b.id === id) || null; }
  function addBook(data) {
    const d = load(); const u = currentUser(); if (!u) return null;
    const b = {
      id: uid('b'), userId: u.id, title: data.title.trim(), author: data.author || '',
      publisher: data.publisher || '', isbn: (data.isbn || '').replace(/[^0-9Xx]/g, ''),
      categoryId: data.categoryId || null, cover: data.cover || null,
      color: Math.floor(Math.random() * COVERS.length), createdAt: now(),
    };
    d.books.push(b); save(); return b;
  }
  function updateBook(id, patch) {
    const d = load(); const b = d.books.find((x) => x.id === id);
    if (b) { Object.assign(b, patch); save(); }
  }
  function removeBook(id) {
    const d = load();
    d.books = d.books.filter((b) => b.id !== id);
    d.notes = d.notes.filter((n) => n.bookId !== id);
    save();
  }
  function booksByIsbn(isbn) {
    const d = load(); const key = String(isbn).replace(/[^0-9Xx]/g, '');
    return d.books.filter((b) => b.isbn === key);
  }

  /* ---------- 笔记 ---------- */
  function note(id) {
    settlePending();
    const d = load();
    const n = d.notes.find((x) => x.id === id);
    if (!n) return null;
    const u = d.users.find((x) => x.id === n.userId);
    const b = d.books.find((x) => x.id === n.bookId);
    return {
      ...n, author: u, book: b,
      likeCount: (n.likeCount || 0) + (n.likes || []).length,
      commentCount: d.comments.filter((c) => c.noteId === n.id && c.status === 'published').length,
    };
  }
  function myNotes(userId) {
    settlePending();
    const d = load();
    return d.notes.filter((n) => n.userId === userId)
      .map((n) => note(n.id)).sort((a, b) => b.createdAt - a.createdAt);
  }
  function notesOfBook(bookId) {
    settlePending();
    const d = load();
    return d.notes.filter((n) => n.bookId === bookId)
      .map((n) => note(n.id)).sort((a, b) => b.createdAt - a.createdAt);
  }
  function addNote(data, opts) {
    opts = opts || {};
    const gate = checkPost('note');
    if (!gate.ok) return { error: gate.msg, hits: [] };
    const d = load(); const u = currentUser(); if (!u) return null;
    const hits = moderate(data.title + '\n' + data.content);
    const n = {
      id: uid('n'), userId: u.id, bookId: data.bookId, title: data.title.trim(),
      page: (data.page || '').toString().trim().slice(0, 16),
      content: data.content, visibility: data.visibility || 'public',
      anonymous: !!data.anonymous, tags: data.tags || [],
      status: opts.draft ? 'draft' : (hits.length ? 'rejected' : 'pending'),
      rejectReason: hits.length ? '含屏蔽词：' + hits.join('、') : '',
      likes: [], likeCount: 0, tipped: 0, createdAt: now(), publishedAt: null,
    };
    d.notes.push(n); save();
    recordPost('note');
    if (!opts.draft && !hits.length && d.settings.reviewAutoPass) {
      setTimeout(() => {
        const dd = load();
        const x = dd.notes.find((y) => y.id === n.id);
        if (x && x.status === 'pending') { x.status = 'published'; x.publishedAt = now(); save(); }
      }, 6000);
    }
    return { note: n, hits };
  }
  function publishDraft(id) {
    const r = updateNote(id, {});
    return r;
  }
  function setNoteStatus(id, status) {
    const d = load(); const n = d.notes.find((x) => x.id === id);
    if (!n) return;
    n.status = status;
    if (status === 'published') n.publishedAt = now();
    save();
  }
  function likeNote(id) {
    const d = load(); const u = currentUser(); if (!u) return 0;
    const n = d.notes.find((x) => x.id === id); if (!n) return 0;
    n.likes = n.likes || [];
    const i = n.likes.indexOf(u.id);
    if (i >= 0) n.likes.splice(i, 1); else n.likes.push(u.id);
    save();
    return (n.likeCount || 0) + n.likes.length;
  }
  function hasLiked(id) {
    const u = currentUser(); const n = load().notes.find((x) => x.id === id);
    return !!(u && n && (n.likes || []).includes(u.id));
  }
  function tipNote(id, amount) {
    const d = load(); const n = d.notes.find((x) => x.id === id);
    const me = currentUser();
    if (!n || !me) return { ok: false, reason: 'not_login' };
    if (n.userId === me.id) return { ok: false, reason: 'self' };
    const cost = amount || TIP_COST;
    const w = walletOf(me.id);
    if (w.balance < cost) return { ok: false, reason: 'no_money', balance: w.balance };

    w.balance -= cost;
    addLedger(w, { type: 'tip_out', amount: -cost, noteId: n.id, desc: '当赏《' + (n.title || '') + '》' });

    n.tipped = (n.tipped || 0) + cost;

    const authorW = walletOf(n.userId);
    authorW.received = (authorW.received || 0) + cost;
    let credited = 0;
    while (authorW.received >= TIP_SHARE) {
      authorW.received -= TIP_SHARE;
      authorW.balance += 1;
      credited += 1;
      addLedger(authorW, { type: 'tip_in', amount: 1, noteId: n.id, desc: '被赏满 ' + TIP_SHARE + ' 壶折算' });
    }
    save();
    return { ok: true, balance: w.balance, tipped: n.tipped, credited };
  }

  /* ---------- 审核结算（跨页面生效） ---------- */
  const NOTE_REVIEW_MS = 6000;
  const COMMENT_REVIEW_MS = 4000;
  let settling = false;
  function settlePending() {
    if (settling) return;
    settling = true;
    try {
      const d = load();
      if (!d.settings || d.settings.reviewAutoPass === false) return;
      const t = now();
      let changed = false;
      (d.notes || []).forEach((n) => {
        if (n.status === 'pending' && t - (n.createdAt || 0) >= NOTE_REVIEW_MS) {
          n.status = 'published';
          n.publishedAt = n.publishedAt || t;
          changed = true;
        }
      });
      (d.comments || []).forEach((c) => {
        if (c.status === 'pending' && t - (c.createdAt || 0) >= COMMENT_REVIEW_MS) {
          c.status = 'published';
          changed = true;
        }
      });
      if (changed) save();
    } finally {
      settling = false;
    }
  }

  /* ---------- 关注 ---------- */
  function followingIds() {
    const d = load(); const u = currentUser();
    return u ? d.follows.filter((f) => f.from === u.id).map((f) => f.to) : [];
  }
  function isFollowing(uid) {
    const u = currentUser();
    return !!(u && load().follows.some((f) => f.from === u.id && f.to === uid));
  }
  function toggleFollow(uid) {
    const d = load(); const u = currentUser();
    if (!u || !uid || u.id === uid) return false;
    const i = d.follows.findIndex((f) => f.from === u.id && f.to === uid);
    if (i >= 0) d.follows.splice(i, 1); else d.follows.push({ from: u.id, to: uid });
    save();
    return i < 0;
  }

  /* ---------- 可见性 ---------- */
  function canView(nid) {
    const d = load(); const u = currentUser();
    const n = d.notes.find((x) => x.id === nid);
    if (!n) return false;
    if (u && n.userId === u.id) return true;
    if (n.status !== 'published') return false;
    if (n.visibility === 'public') return true;
    if (n.visibility === 'followers') {
      return !!(u && d.follows.some((f) => f.from === u.id && f.to === n.userId));
    }
    return false;
  }

  /* ---------- 编辑 / 删除 ---------- */
  function updateNote(id, patch) {
    const d = load(); const u = currentUser();
    const n = d.notes.find((x) => x.id === id);
    if (!n || !u || n.userId !== u.id) return { error: '只能改自己的笔记' };
    const hits = moderate((patch.title || n.title) + '\n' + (patch.content || n.content));
    Object.assign(n, patch);
    if (hits.length) {
      n.status = 'rejected'; n.rejectReason = '含屏蔽词：' + hits.join('、');
    } else if (n.status === 'published') {
      n.status = 'pending';
    }
    save();
    return { note: n, hits };
  }
  function removeNote(id) {
    const d = load(); const u = currentUser();
    const n = d.notes.find((x) => x.id === id);
    if (!n || !u || n.userId !== u.id) return false;
    d.notes = d.notes.filter((x) => x.id !== id);
    d.comments = d.comments.filter((c) => c.noteId !== id);
    save();
    return true;
  }
  function removeComment(id) {
    const d = load(); const u = currentUser();
    const c = d.comments.find((x) => x.id === id);
    if (!c || !u || (c.userId !== u.id && u.role !== 'owner')) return false;
    d.comments = d.comments.filter((x) => x.id !== id);
    save();
    return true;
  }

  /* ---------- 举报 ---------- */
  function report(targetType, targetId, reason) {
    const d = load(); const u = currentUser();
    d.feedback.push({
      id: uid('rp'), userId: u ? u.id : null, username: u ? u.username : '游客',
      type: '举报', targetType, targetId, content: reason || '（未填写理由）', ts: now(),
    });
    save();
  }

  /* ---------- 改密码 ---------- */
  function changePassword(oldPass, newPass) {
    const u = currentUser();
    if (!u) return { ok: false, msg: '请先登录' };
    if (u.pass !== hash(oldPass)) return { ok: false, msg: '原密码不对' };
    if (String(newPass).length < 6) return { ok: false, msg: '新密码至少 6 位' };
    const d = load();
    d.users.find((x) => x.id === u.id).pass = hash(newPass);
    save();
    return { ok: true };
  }

  /* ---------- 评论 ---------- */
  function comments(noteId) {
    settlePending();
    const d = load();
    return d.comments.filter((c) => c.noteId === noteId && c.status === 'published')
      .map((c) => {
        const u = d.users.find((x) => x.id === c.userId) || { username: '无名酒客' };
        const likes = (c.likeCount || 0) + (c.likes || []).length;
        return { ...c, author: u, totalLikes: likes, weight: likes * (c.anonymous ? 2 / 3 : 1) };
      })
      .sort((a, b) => b.weight - a.weight || b.createdAt - a.createdAt);
  }
  function addComment(noteId, content, anonymous) {
    const gate = checkPost('comment');
    if (!gate.ok) return { error: gate.msg };
    const d = load(); const u = currentUser(); if (!u) return null;
    const hits = moderate(content);
    if (hits.length) return { error: '含屏蔽词：' + hits.join('、') };
    const c = {
      id: uid('cm'), noteId, userId: u.id, content: content.trim(),
      anonymous: !!anonymous, likeCount: 0, likes: [],
      status: d.settings.reviewAutoPass ? 'pending' : 'pending', createdAt: now(),
    };
    d.comments.push(c); save();
    recordPost('comment');
    if (d.settings.reviewAutoPass) {
      setTimeout(() => {
        const dd = load(); const x = dd.comments.find((y) => y.id === c.id);
        if (x && x.status === 'pending') { x.status = 'published'; save(); }
      }, 4000);
    }
    return { comment: c };
  }
  function likeComment(id) {
    const d = load(); const u = currentUser(); if (!u) return 0;
    const c = d.comments.find((x) => x.id === id); if (!c) return 0;
    c.likes = c.likes || [];
    const i = c.likes.indexOf(u.id);
    if (i >= 0) c.likes.splice(i, 1); else c.likes.push(u.id);
    save();
    return c.likeCount + c.likes.length;
  }

  /* ---------- 酒肆信息流 ---------- */
  function feed({ page = 0, size = 8, q = '', sort = 'new', scope = 'all' } = {}) {
    settlePending();
    const d = load();
    const me = currentUser();
    let list = d.notes.filter((n) => n.status === 'published' && n.visibility === 'public');
    if (scope === 'follow' && me) {
      const following = d.follows.filter((f) => f.from === me.id).map((f) => f.to);
      list = d.notes.filter((n) =>
        n.status === 'published' &&
        (n.visibility === 'public' ||
          (n.visibility === 'followers' && following.includes(n.userId)) ||
          n.userId === me.id) &&
        (following.includes(n.userId) || n.userId === me.id));
    }
    if (scope === 'isbn' && q) {
      const books = d.books.filter((b) => b.isbn === q.replace(/[^0-9Xx]/g, ''));
      const ids = books.map((b) => b.id);
      list = d.notes.filter((n) => ids.includes(n.bookId) && n.status === 'published');
      const all = list.map((n) => note(n.id)).sort((a, b) => hotScore(b) - hotScore(a));
      return { items: all.slice(page * size, page * size + size), total: all.length };
    }
    if (q) {
      const k = q.trim().toLowerCase();
      const books = d.books.filter((b) =>
        (b.title + b.author + b.isbn + (b.publisher || '')).toLowerCase().includes(k));
      const ids = books.map((b) => b.id);
      list = list.filter((n) =>
        ids.includes(n.bookId) ||
        (n.title + n.content + (n.tags || []).join('')).toLowerCase().includes(k));
    }
    const items = list.map((n) => note(n.id));
    if (sort === 'hot') items.sort((a, b) => hotScore(b) - hotScore(a));
    else items.sort((a, b) => b.createdAt - a.createdAt);
    return { items: items.slice(page * size, page * size + size), total: items.length };
  }

  /* ---------- 屏蔽词 ---------- */
  function parseWords(text) {
    return text.split(/\r?\n/).map((s) => s.trim())
      .filter((s) => s && !s.startsWith('#'));
  }
  function blockedWords() {
    const d = load();
    return parseWords(d.blockwords || '');
  }
  function setBlockwords(text) { const d = load(); d.blockwords = text; save(); }
  function addBlockword(w) {
    const d = load(); w = w.trim(); if (!w) return false;
    if (parseWords(d.blockwords).includes(w)) return false;
    d.blockwords = (d.blockwords || '') + '\n' + w; save(); return true;
  }
  function removeBlockword(w) {
    const d = load();
    d.blockwords = parseWords(d.blockwords).filter((x) => x !== w).join('\n');
    save();
  }
  function moderate(text) {
    const words = blockedWords();
    const t = String(text || '').toLowerCase();
    return words.filter((w) => t.includes(w.toLowerCase()));
  }

  /* ---------- 反馈 ---------- */
  function addFeedback(type, content) {
    const d = load(); const u = currentUser();
    d.feedback.push({
      id: uid('fb'), userId: u ? u.id : null, username: u ? u.username : '游客',
      type, content, ts: now(),
    });
    save();
  }
  function feedbackList() { return load().feedback.slice().reverse(); }

  /* ---------- 后台统计 ---------- */
  function stats() {
    const d = load();
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const t0 = today0.getTime();
    const visits = d.events.filter((e) => e.type === 'visit');
    const dau = new Set(visits.filter((e) => e.ts >= t0).map((e) => e.userId)).size;
    const mau = new Set(visits.filter((e) => e.ts >= t0 - 30 * DAY).map((e) => e.userId)).size;
    const stays = visits.filter((e) => e.stay > 0).map((e) => e.stay);
    const avgStay = stays.length ? Math.round(stays.reduce((a, b) => a + b, 0) / stays.length / 60) : 0;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const s = t0 - i * DAY, e = s + DAY;
      const set = new Set(visits.filter((x) => x.ts >= s && x.ts < e).map((x) => x.userId));
      days.push({ label: new Date(s).getMonth() + 1 + '/' + new Date(s).getDate(), v: set.size });
    }
    return {
      users: d.users.length,
      dau, mau,
      avgStay,
      notes: d.notes.filter((n) => n.status === 'published').length,
      pending: d.notes.filter((n) => n.status === 'pending').length,
      comments: d.comments.length,
      days,
      totalVisits: visits.length,
    };
  }

  /* ---------- 导出 Markdown ---------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateStr(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function noteMarkdown(id, idx) {
    const n = note(id);
    if (!n) return '';
    const b = n.book || {};
    const lines = [];
    lines.push('### ' + (n.title || '无题'));
    lines.push('');
    lines.push('- 时间：' + dateStr(n.createdAt));
    if (n.page) lines.push('- 页码：第 ' + n.page + ' 页');
    lines.push('- 可见：' + ({ public: '所有人可见', followers: '关注者可见', private: '仅自己可见' }[n.visibility] || '仅自己可见')
      + ' · ' + (n.anonymous ? '匿名' : '实名'));
    if ((n.tags || []).length) lines.push('- 标签：' + n.tags.map((t) => '#' + t).join(' '));
    lines.push('- 赞 ' + (n.likeCount || 0) + ' · 赏 ' + (n.tipped || 0) + ' 壶');
    lines.push('');
    lines.push(String(n.content || '').trim());
    lines.push('');
    lines.push('---');
    lines.push('');
    return lines.join('\n');
  }
  function exportMarkdown(userId) {
    const u = userId ? load().users.find((x) => x.id === userId) : currentUser();
    if (!u) return '';
    const bookList = books(u.id);
    const notes = myNotes(u.id);
    const out = [];
    out.push('# 我的读书笔记');
    out.push('');
    out.push('> 导出自「四夕酒馆」 · ' + dateStr(now()));
    out.push('> 共 ' + notes.length + ' 篇，涉及 ' + bookList.length + ' 本书。');
    out.push('');
    bookList.forEach((b) => {
      const list = notes.filter((n) => n.bookId === b.id);
      if (!list.length) return;
      out.push('## 《' + b.title + '》' + (b.author ? ' · ' + b.author : ''));
      if (b.isbn) out.push('');
      if (b.isbn) out.push('ISBN ' + b.isbn + (b.publisher ? ' · ' + b.publisher : ''));
      out.push('');
      list.forEach((n) => out.push(noteMarkdown(n.id)));
    });
    const orphans = notes.filter((n) => !bookList.some((b) => b.id === n.bookId));
    if (orphans.length) {
      out.push('## 未归档');
      out.push('');
      orphans.forEach((n) => out.push(noteMarkdown(n.id)));
    }
    return out.join('\n');
  }

  /* ---------- 工具 ---------- */
  function fmtTime(ts) {
    if (!ts) return '';
    const diff = now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
    if (diff < DAY) return Math.floor(diff / 3600000) + ' 小时前';
    if (diff < 30 * DAY) return Math.floor(diff / DAY) + ' 天前';
    const d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function excerpt(text, n) {
    return String(text || '')
      .replace(/^>\s?/gm, '')
      .replace(/[#*`]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, n || 80);
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[m]));
  }
  function nl2p(text) {
    const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let quote = [];
    const flush = () => {
      if (quote.length) {
        out.push('<blockquote><p>' + quote.map(escapeHtml).join('<br>') + '</p></blockquote>');
        quote = [];
      }
    };
    lines.forEach((raw) => {
      const line = raw.replace(/^\s+/, '').replace(/\s+$/, '');
      if (!line) { flush(); return; }
      if (/^>\s?/.test(line)) { quote.push(line.replace(/^>\s?/, '')); return; }
      flush();
      // 一行即一段：每段都是独立的 <p>，CSS 统一 text-indent:2em
      out.push('<p>' + escapeHtml(line) + '</p>');
    });
    flush();
    return out.join('');
  }

  function colorPair(i) { return COVERS[i % COVERS.length]; }

  window.Store = {
    load, save, reset,
    currentUser, login, register, guest, logout, updateUser,
    categories, addCategory, renameCategory, removeCategory, moveCategory, reorderCategories,
    books, book, addBook, updateBook, removeBook, booksByIsbn,
    note, myNotes, notesOfBook, addNote, updateNote, removeNote, publishDraft, setNoteStatus,
    likeNote, hasLiked, tipNote,
    followingIds, isFollowing, toggleFollow, canView, report, changePassword,
    checkSignup, checkPost, checkLogin,
    wallet, walletOf, grantDaily, hotScore, W_LIKE, W_TIP, W_COMMENT, ANON_FACTOR,
    DAILY_WINE, TIP_COST, TIP_SHARE,
    comments, addComment, likeComment, removeComment,
    feed, blockedWords, setBlockwords, addBlockword, removeBlockword, parseWords, moderate,
    addFeedback, feedbackList, stats,
    noteMarkdown, exportMarkdown,
    fmtTime, escapeHtml, excerpt, nl2p, colorPair,
    DEFAULT_BLOCKWORDS: BLOCKWORDS,
    _users: () => load().users,
  };
})();
