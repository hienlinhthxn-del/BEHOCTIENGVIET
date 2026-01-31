
import React from 'react';
import { BookOpen, PenTool, Sparkles, MessageCircle, Home, Image as ImageIcon, Film, Trophy, BarChart3, Heart } from 'lucide-react';
import { Lesson, WritingExercise, AppView, AppTheme, Exercise } from './types';

// Helper tạo bài tập trắc nghiệm nhanh cho các bài học
const createSelectionEx = (id: string, question: string, options: string[], correct: string): Exercise => ({
  id: `ex-${id}`,
  type: 'selection',
  question,
  options,
  correctAnswer: correct,
  expectedConcept: correct
});

// Helper tạo bài học chuẩn SGK Tập 1
const createT1Lesson = (id: string, title: string, page: number, sounds: string[], words: string[], sentences: string[], matchingPairs?: any[]): Lesson => {
  const exercises: Exercise[] = [
    createSelectionEx(id, `Tiếng nào sau đây có chứa âm/vần "${sounds[0] || title.split(' ')[0]}"?`, [...words, 'lá', 'me', 'bố', 'cá'].slice(0, 4), words[0])
  ];

  if (matchingPairs && matchingPairs.length > 0) {
    exercises.push({
      id: `match-${id}`,
      type: 'matching',
      question: 'Bé hãy nối chữ đúng với âm thanh tương ứng nhé!',
      expectedConcept: 'matching_completed',
      matchingPairs: matchingPairs
    });
  }

  return {
    id,
    title: `Bài ${id}: ${title}`,
    pageNumber: page,
    volume: 1,
    type: id.includes('Ôn tập') ? 'review' : 'alphabet',
    content: {
      sounds,
      words,
      sentences,
      paragraphs: [`Bé hãy luyện đọc thật kỹ bài ${title} ở trang ${page} nhé.`],
      exercises
    }
  };
};

// --- DANH SÁCH TẬP 1 (Cập nhật đầy đủ từ 1 - 83) ---
const GENERATED_LESSONS_V1: Lesson[] = [
  createT1Lesson('1', 'A a', 14, ['a'], ['ca', 'gà'], ['Nam và Hà ca hát.']),
  createT1Lesson('2', 'B b', 16, ['b'], ['ba', 'bà'], ['Bà cho bé búp bê.']),
  createT1Lesson('3', 'C c', 18, ['c'], ['ca', 'cá'], ['Bố và Nam câu cá.']),
  createT1Lesson('4', 'E e, Ê ê', 20, ['e', 'ê'], ['be', 'bê'], ['Bé kể mẹ nghe.']),
  createT1Lesson('5', 'Ôn tập', 22, [], ['ba', 'ca'], ['Bà bế bé.']),
  createT1Lesson('6', 'O o', 24, ['o'], ['co', 'cỏ'], ['Đàn bò gặm cỏ.']),
  createT1Lesson('7', 'Ô ô', 26, ['ô'], ['cô', 'hồ'], ['Cô và bé đi bộ.']),
  createT1Lesson('8', 'D d, Đ đ', 28, ['d', 'đ'], ['da', 'đỏ'], ['Bé có ô đỏ.']),
  createT1Lesson('9', 'Ơ ơ', 30, ['ơ'], ['cờ', 'bờ'], ['Tàu dỡ hàng ở bờ.']),
  createT1Lesson('10', 'Ôn tập', 32, [], ['đỏ', 'cô'], ['Bà có đỗ đỏ.']),
  createT1Lesson('11', 'I i, K k', 34, ['i', 'k'], ['bi', 'kẻ'], ['Nam vẽ kì đà.']),
  createT1Lesson('12', 'H h, L l', 36, ['h', 'l'], ['hổ', 'lá'], ['Le le bơi trên hồ.']),
  createT1Lesson('13', 'U u, Ư ư', 38, ['u', 'ư'], ['nụ', 'thư'], ['Đu đủ chín ngọt.']),
  createT1Lesson('14', 'Ch ch, Kh kh', 40, ['ch', 'kh'], ['chợ', 'khế'], ['Chú khỉ ăn chuối.']),
  createT1Lesson('15', 'Ôn tập', 42, [], ['chợ', 'khế'], ['Dì Kha đi chợ.']),
  createT1Lesson('16', 'M m, N n', 44, ['m', 'n'], ['mẹ', 'nơ'], ['Mẹ mua nơ cho Hà.']),
  createT1Lesson('17', 'G g, Gi gi', 46, ['g', 'gi'], ['gà', 'giỏ'], ['Hà có giỏ gà.']),
  createT1Lesson('18', 'Gh gh, Nh nh', 48, ['gh', 'nh'], ['ghế', 'nhà'], ['Hà ghé nhà bà.']),
  createT1Lesson('19', 'Ng ng, Ngh ngh', 50, ['ng', 'ngh'], ['ngõ', 'nghệ'], ['Nghé theo mẹ.']),
  createT1Lesson('20', 'Ôn tập', 52, [], ['nghệ', 'ngõ'], ['Mẹ ghé nhà bà.']),
  createT1Lesson('21', 'R r, S s', 54, ['r', 's'], ['rổ', 'sẻ'], ['Bầy sẻ ríu rít.']),
  createT1Lesson('22', 'T t, Tr tr', 56, ['t', 'tr'], ['tre', 'tô'], ['Nam tô tranh tre.']),
  createT1Lesson('23', 'Th th, ia', 58, ['th', 'ia'], ['thỏ', 'chia'], ['Bé được chia quà.']),
  createT1Lesson('24', 'ua, ưa', 60, ['ua', ' ưa'], ['cua', 'ngựa'], ['Mẹ đưa Hà đi múa.']),
  createT1Lesson('25', 'Ôn tập', 62, [], ['tre', 'ngựa'], ['Nhà bà có dừa.']),
  createT1Lesson('26', 'Ph ph, Qu qu', 64, ['ph', 'qu'], ['phố', 'quê'], ['Nhà về thăm quê.']),
  createT1Lesson('27', 'V v, X x', 66, ['v', 'x'], ['vở', 'xe'], ['Hà vẽ xe đạp.']),
  createT1Lesson('28', 'Y y', 68, ['y'], ['y tá', 'quý'], ['Thời gian quý giá.']),
  createT1Lesson('29', 'Ôn tập', 70, [], ['quê', 'xe'], ['Quê Hà thật đẹp.']),
  createT1Lesson('31', 'an, ăn, ân', 74, ['an'], ['bạn', 'khăn'], ['Đôi bạn rất thân.']),
  createT1Lesson('32', 'on, ôn, ơn', 76, ['on'], ['con', 'lớn'], ['Sơn ca véo von.']),
  createT1Lesson('33', 'en, ên, in, un', 78, ['en'], ['đèn', 'nến'], ['Cún con nhìn dế.']),
  createT1Lesson('34', 'am, ăm, âm', 80, ['am'], ['cam', 'nằm'], ['Nhện ngắm lưới.']),
  createT1Lesson('35', 'Ôn tập', 82, [], ['đèn', 'cam'], ['Vườn nhà có cam.']),
  createT1Lesson('36', 'om, ôm, ơm', 84, ['om'], ['xóm', 'cơm'], ['Hương cốm thơm.']),
  createT1Lesson('37', 'em, êm, im, um', 86, ['em'], ['đếm', 'tím'], ['Hà chơi trốn tìm.']),
  createT1Lesson('38', 'ai, ay, ây', 88, ['ai'], ['hai', 'mây'], ['Hai bạn nhảy dây.']),
  createT1Lesson('39', 'oi, ôi, ơi', 90, ['oi'], ['voi', 'mới'], ['Voi mời bạn đi.']),
  createT1Lesson('40', 'Ôn tập', 92, [], ['voi', 'mây'], ['Đám mây xám xịt.']),
  createT1Lesson('41', 'ui, ưi', 94, ['ui'], ['túi', 'gửi'], ['Bà gửi túi kẹo.']),
  createT1Lesson('42', 'ao, eo', 96, ['ao'], ['sao', 'kẹo'], ['Ao thu nước trong.']),
  createT1Lesson('43', 'au, âu, êu', 98, ['au'], ['sau', 'trâu'], ['Đàn sẻ nâu kêu.']),
  createT1Lesson('44', 'iu, ưu', 100, ['iu'], ['rìu', 'lựu'], ['Bà đã nghỉ hưu.']),
  createT1Lesson('45', 'Ôn tập', 102, [], ['trâu', 'lựu'], ['Bé yêu quê nội.']),
  createT1Lesson('46', 'iêc, iên, iêp', 104, ['iên'], ['tiên', 'biển'], ['Biển xanh mênh mông.']),
  createT1Lesson('47', 'iêt, iêu, iêu', 106, ['iêu'], ['diều', 'viết'], ['Bé thả diều biếc.']),
  createT1Lesson('48', 'ươc, ươn, ươt', 108, ['ươn'], ['vườn', 'lướt'], ['Vườn nhà xanh tốt.']),
  createT1Lesson('49', 'ươt, ươu, yêu', 110, ['yêu'], ['yêu', 'rượu'], ['Bé yêu cô giáo.']),
  createT1Lesson('50', 'Ôn tập', 112, [], ['biển', 'vườn'], ['Mẹ đi chợ về.']),
  createT1Lesson('51', 'uôc, uôn, uôt', 114, ['uôn'], ['cuộn', 'chuột'], ['Mèo đuổi chuột.']),
  createT1Lesson('52', 'uôi, uôm, uông', 116, ['uôi'], ['chuối', 'buồm'], ['Thuyền buồm ra khơi.']),
  createT1Lesson('53', 'uôt, uơ, uya', 118, ['uya'], ['khuya', 'huơ'], ['Đêm đã khuya rồi.']),
  createT1Lesson('54', 'uân, uât', 120, ['uân'], ['xuân', 'luật'], ['Mùa xuân ấm áp.']),
  createT1Lesson('55', 'Ôn tập', 122, [], ['chuối', 'xuân'], ['Cây cối đâm chồi.']),
  createT1Lesson('56', 'uynh, uych', 124, ['uynh'], ['quỳnh', 'uỵch'], ['Hoa quỳnh nở đêm.']),
  createT1Lesson('57', 'oanh, oach', 126, ['oanh'], ['doanh', 'hoạch'], ['Kế hoạch nhỏ.']),
  createT1Lesson('58', 'oang, oăng, oăng', 128, ['oang'], ['khoang', 'hoẵng'], ['Khoang tàu rất rộng.']),
  createT1Lesson('59', 'oat, oắt, oăt', 130, ['oat'], ['thoát', 'loắt'], ['Sóc con thoăn thoắt.']),
  createT1Lesson('60', 'Ôn tập', 132, [], ['khoang', 'quỳnh'], ['Bé giúp mẹ việc nhà.']),
  createT1Lesson('61', 'oai, oay, oay', 134, ['oai'], ['xoài', 'ngoáy'], ['Quả xoài chín vàng.']),
  createT1Lesson('62', 'oan, oăn, oăn', 136, ['oan'], ['ngoan', 'xoắn'], ['Bé ngoan nhận quà.']),
  createT1Lesson('63', 'oát, oăt, oăt', 138, ['oat'], ['loát', 'thoát'], ['Chuột chạy thoăn thoắt.']),
  createT1Lesson('64', 'oe, oen, oet', 140, ['oe'], ['hòe', 'xoèn'], ['Hoa hòe nở rộ.']),
  createT1Lesson('65', 'Ôn tập', 142, [], ['xoài', 'ngoan'], ['Hà là bé ngoan.']),
  createT1Lesson('66', 'uân, uât, uât', 144, ['uân'], ['huân', 'uất'], ['Chú nhận huân chương.']),
  createT1Lesson('67', 'uênh, uếch', 146, ['uênh'], ['uênh', 'huếch'], ['Cái hố huếch hoác.']),
  createT1Lesson('68', 'uơ, uya', 148, ['uya'], ['khuya', 'thuở'], ['Ngày xửa ngày xưa.']),
  createT1Lesson('69', 'uân, uýt, uyu', 150, ['uyu'], ['khuỷu', 'huýt'], ['Đường đi khúc khuỷu.']),
  createT1Lesson('70', 'Ôn tập', 152, [], ['khuỷu', 'khuya'], ['Bé ngủ thật ngon.']),
  createT1Lesson('71', 'Vần có âm cuối n', 154, ['an'], ['bàn', 'đàn'], ['Bé tập đánh đàn.']),
  createT1Lesson('72', 'Vần có âm cuối t', 156, ['at'], ['hát', 'mát'], ['Bé hát líu lo.']),
  createT1Lesson('73', 'Vần có âm cuối m', 158, ['am'], ['làm', 'chàm'], ['Hà làm bài tập.']),
  createT1Lesson('74', 'Vần có âm cuối p', 160, ['ap'], ['tháp', 'đáp'], ['Tháp Rùa ở hồ Gươm.']),
  createT1Lesson('75', 'Ôn tập', 162, [], ['đàn', 'hát'], ['Lớp em liên hoan.']),
  createT1Lesson('76', 'Vần có âm cuối ng', 164, ['ang'], ['làng', 'vàng'], ['Lúa chín vàng óng.']),
  createT1Lesson('77', 'Vần có âm cuối c', 166, ['ac'], ['hạc', 'nhạc'], ['Bé nghe nhạc.']),
  createT1Lesson('78', 'Vần có âm cuối nh', 168, ['anh'], ['xanh', 'bánh'], ['Bánh chưng ngày Tết.']),
  createT1Lesson('79', 'Vần có âm cuối ch', 170, ['ach'], ['sách', 'gạch'], ['Bé giữ gìn sách.']),
  createT1Lesson('80', 'Ôn tập', 172, [], ['sách', 'vàng'], ['Em yêu sách quý.']),
  createT1Lesson('81', 'Ôn tập cuối học kì 1 (1)', 174, [], ['biển', 'rừng'], ['Đất nước tươi đẹp.']),
  createT1Lesson('82', 'Ôn tập cuối học kì 1 (2)', 176, [], ['đường', 'làng'], ['Đường làng sạch sẽ.']),
  createT1Lesson('83', 'Kiểm tra học kì 1', 178, [], ['học', 'tập'], ['Bé làm bài tốt.']),
];

// --- DANH SÁCH TẬP 2 (Đầy đủ 35 bài chủ điểm) ---
const GENERATED_LESSONS_V2: Lesson[] = [
  { id: 't2-b1', title: 'Bài 1: Tôi là học sinh lớp 1', pageNumber: 4, volume: 2, type: 'story', content: { 
      words: ['đồng phục', 'hãnh diện', 'chững chạc'], 
      paragraphs: ['Tôi tên là Nam, học sinh lớp 1A. Ngày đầu đi học, mặc bộ đồng phục của trường, tôi hãnh diện lắm.'],
      exercises: [createSelectionEx('t2b1', 'Nam học lớp mấy?', ['Lớp 1A', 'Lớp 1B', 'Lớp 2A'], 'Lớp 1A')]
  }},
  { id: 't2-b2', title: 'Bài 2: Đôi tai xấu xí', pageNumber: 8, volume: 2, type: 'story', content: { 
      words: ['động viên', 'quên khuấy', 'thính'], 
      paragraphs: ['Thỏ có đôi tai dài và to. Nhờ có đôi tai thính, thỏ đã nghe thấy tiếng gọi của bố.'],
      exercises: [createSelectionEx('t2b2', 'Thỏ nghe thấy tiếng bố nhờ đôi tai như thế nào?', ['Tai thính', 'Tai to', 'Tai dài'], 'Tai thính')]
  }},
  { id: 't2-b3', title: 'Bài 3: Bạn của Duy', pageNumber: 12, volume: 2, type: 'story', content: {
      words: ['gắn bó', 'líu lo'],
      paragraphs: ['Duy có một người bạn là chú chim nhỏ thường bay đến cửa sổ mỗi sáng.'],
      exercises: [createSelectionEx('t2b3', 'Bạn thân của Duy là ai?', ['Chú chim nhỏ', 'Con mèo', 'Con chó'], 'Chú chim nhỏ')]
  }},
  { id: 't2-b4', title: 'Bài 4: Chuyện của hoa hồng', pageNumber: 16, volume: 2, type: 'story', content: {
      words: ['rực rỡ', 'ngào ngạt', 'kiêu ngạo'],
      paragraphs: ['Hoa hồng nở rực rỡ nhưng kiêu ngạo chẳng thèm nhìn đến các loài hoa khác.'],
      exercises: [createSelectionEx('t2b4', 'Hoa hồng có tính cách như thế nào?', ['Kiêu ngạo', 'Khiêm tốn', 'Nhút nhát'], 'Kiêu ngạo')]
  }},
  { id: 't2-b5', title: 'Bài 5: Ôn tập và kể chuyện', pageNumber: 20, volume: 2, type: 'review', content: {
      paragraphs: ['Chúng mình đã học về những người bạn đáng yêu. Bé hãy kể lại một câu chuyện nhé.'],
      exercises: [createSelectionEx('t2b5', 'Tuần qua bé học về chủ điểm gì?', ['Tôi và bạn', 'Gia đình', 'Thiên nhiên'], 'Tôi và bạn')]
  }},
  { id: 't2-b6', title: 'Bài 6: Nụ hôn trên bàn tay', pageNumber: 24, volume: 2, type: 'story', content: {
      words: ['ấm áp', 'can đảm'],
      paragraphs: ['Mẹ mèo đặt nụ hôn vào lòng bàn tay bé mèo. Nụ hôn này sẽ giúp con can đảm khi ở trường.'],
      exercises: [createSelectionEx('t2b6', 'Nụ hôn của mẹ giúp mèo con cảm thấy thế nào?', ['Can đảm', 'Sợ hãi', 'Buồn bã'], 'Can đảm')]
  }},
  { id: 't2-b7', title: 'Bài 7: Làm anh', pageNumber: 28, volume: 2, type: 'story', content: {
      words: ['nhường nhịn', 'dịu dàng'],
      paragraphs: ['Làm anh khó đấy, phải đâu chuyện đùa. Với em gái bé, phải người lớn cơ.'],
      exercises: [createSelectionEx('t2b7', 'Khi em bé khóc, anh phải làm gì?', ['Dỗ dành', 'Bỏ chạy', 'Mắng em'], 'Dỗ dành')]
  }},
  { id: 't2-b8', title: 'Bài 8: Cả nhà đi chơi núi', pageNumber: 32, volume: 2, type: 'story', content: {
      words: ['quanh co', 'bao la'],
      paragraphs: ['Đường lên núi quanh co nhưng cảnh vật rất đẹp. Từ đỉnh núi nhìn xuống cánh đồng bao la.'],
      exercises: [createSelectionEx('t2b8', 'Đường lên núi như thế nào?', ['Quanh co', 'Thẳng tắp', 'Bằng phẳng'], 'Quanh co')]
  }},
  { id: 't2-b9', title: 'Bài 9: Quạt cho bà ngủ', pageNumber: 36, volume: 2, type: 'story', content: {
      words: ['thiu thiu', 'hiếu thảo'],
      paragraphs: ['Bà bị ốm, bà nằm ngủ trên giường. Bé cầm chiếc quạt giấy, quạt nhẹ nhàng cho bà.'],
      exercises: [createSelectionEx('t2b9', 'Bé quạt cho ai ngủ?', ['Cho bà', 'Cho mẹ', 'Cho mèo'], 'Cho bà')]
  }},
  { id: 't2-b10', title: 'Bài 10: Ôn tập và kể chuyện', pageNumber: 40, volume: 2, type: 'review', content: {
      paragraphs: ['Gia đình là nơi yêu thương nhất. Bé hãy luôn ngoan ngoãn nhé.'],
      exercises: [createSelectionEx('t2b10', 'Bé làm gì để ông bà vui?', ['Học giỏi, lễ phép', 'Đi chơi xa', 'Lười học'], 'Học giỏi, lễ phép')]
  }},
  { id: 't2-b11', title: 'Bài 11: Đi học', pageNumber: 44, volume: 2, type: 'story', content: {
      words: ['hương rừng', 'cọ xòe ô'],
      paragraphs: ['Hương rừng thơm đồi vắng. Cọ xòe ô che nắng. Râm mát đường em đi.'],
      exercises: [createSelectionEx('t2b11', 'Cái gì xòe ô che nắng cho em?', ['Cây cọ', 'Cây bàng', 'Cây phượng'], 'Cây cọ')]
  }},
  { id: 't2-b12', title: 'Bài 12: Gửi lời chào lớp 1', pageNumber: 48, volume: 2, type: 'story', content: {
      words: ['tạm biệt', 'ngẩn ngơ'],
      paragraphs: ['Tạm biệt lớp 1 thân yêu. Chúng em lên lớp 2, vẫn nhớ hoài lớp 1.'],
      exercises: [createSelectionEx('t2b12', 'Các bạn nhỏ chuẩn bị lên lớp mấy?', ['Lớp 2', 'Lớp 3', 'Lớp 4'], 'Lớp 2')]
  }},
  { id: 't2-b13', title: 'Bài 13: Quyển vở của em', pageNumber: 52, volume: 2, type: 'story', content: {
      words: ['ngay ngắn', 'giữ gìn'],
      paragraphs: ['Quyển vở này mở ra. Từng dòng kẻ ngay ngắn. Em giữ gìn vở sạch.'],
      exercises: [createSelectionEx('t2b13', 'Dòng kẻ trong vở như thế nào?', ['Ngay ngắn', 'Cong queo', 'Rối mắt'], 'Ngay ngắn')]
  }},
  { id: 't2-b14', title: 'Bài 14: Phiêu lưu của giọt nước', pageNumber: 56, volume: 2, type: 'story', content: {
      words: ['mênh mông', 'biển cả'],
      paragraphs: ['Giọt nước từ suối chảy ra sông, rồi ra biển cả mênh mông.'],
      exercises: [createSelectionEx('t2b14', 'Giọt nước chảy về đâu cuối cùng?', ['Biển cả', 'Cái ao', 'Cái lu'], 'Biển cả')]
  }},
  { id: 't2-b15', title: 'Bài 15: Ôn tập và kể chuyện', pageNumber: 60, volume: 2, type: 'review', content: {
      paragraphs: ['Trường học là ngôi nhà thứ hai của bé. Hãy yêu trường lớp nhé.'],
      exercises: [createSelectionEx('t2b15', 'Trường học dạy bé điều gì?', ['Điều hay lẽ phải', 'Nghịch ngợm', 'Lười biếng'], 'Điều hay lẽ phải')]
  }},
  { id: 't2-b16', title: 'Bài 16: Hải cẩu', pageNumber: 64, volume: 2, type: 'story', content: {
      words: ['vây chân', 'biển lạnh'],
      paragraphs: ['Hải cẩu sống ở vùng biển lạnh. Chúng có đôi vây chân rất khỏe để bơi.'],
      exercises: [createSelectionEx('t2b16', 'Hải cẩu sống ở đâu?', ['Biển lạnh', 'Sa mạc', 'Rừng rậm'], 'Biển lạnh')]
  }},
  { id: 't2-b17', title: 'Bài 17: Chuyện của gió', pageNumber: 68, volume: 2, type: 'story', content: {
      words: ['phiêu du', 'mát rượi'],
      paragraphs: ['Gió đi khắp nơi, thổi mát rượi những ngày hè nắng gắt.'],
      exercises: [createSelectionEx('t2b17', 'Gió giúp bé cảm thấy thế nào?', ['Mát rượi', 'Nóng bức', 'Lạnh buốt'], 'Mát rượi')]
  }},
  { id: 't2-b18', title: 'Bài 18: Chim sơn ca', pageNumber: 72, volume: 2, type: 'story', content: {
      words: ['xanh thẳm', 'hót vang'],
      paragraphs: ['Chim sơn ca hót vang giữa bầu trời xanh thẳm.'],
      exercises: [createSelectionEx('t2b18', 'Chim sơn ca hót ở đâu?', ['Giữa bầu trời', 'Trong hang', 'Dưới đất'], 'Giữa bầu trời')]
  }},
  { id: 't2-b19', title: 'Bài 19: Đầm sen', pageNumber: 76, volume: 2, type: 'story', content: {
      words: ['tinh khiết', 'nhị vàng'],
      paragraphs: ['Hoa sen nở trong đầm mang vẻ đẹp tinh khiết và hương thơm ngào ngạt.'],
      exercises: [createSelectionEx('t2b19', 'Hoa sen có đặc điểm gì?', ['Tinh khiết', 'Hôi hám', 'Màu đen'], 'Tinh khiết')]
  }},
  { id: 't2-b20', title: 'Bài 20: Ôn tập và kể chuyện', pageNumber: 80, volume: 2, type: 'review', content: {
      paragraphs: ['Thiên nhiên bao la có bao loài vật và cây cỏ kỳ diệu.'],
      exercises: [createSelectionEx('t2b20', 'Sen mọc ở đâu?', ['Trong đầm', 'Trên núi', 'Trong nhà'], 'Trong đầm')]
  }},
  { id: 't2-b21', title: 'Bài 21: Đèn giao thông', pageNumber: 84, volume: 2, type: 'story', content: {
      words: ['tín hiệu', 'an toàn'],
      paragraphs: ['Đèn đỏ báo dừng lại, đèn xanh báo được đi.'],
      exercises: [createSelectionEx('t2b21', 'Đèn xanh báo hiệu điều gì?', ['Được đi', 'Dừng lại', 'Đi chậm'], 'Được đi')]
  }},
  { id: 't2-b22', title: 'Bài 22: Chú hề', pageNumber: 88, volume: 2, type: 'story', content: {
      words: ['tung hứng', 'mũi đỏ'],
      paragraphs: ['Chú hề mũi đỏ làm trò tung hứng khiến các bạn nhỏ cười vang.'],
      exercises: [createSelectionEx('t2b22', 'Chú hề làm gì cho bé vui?', ['Tung hứng', 'Khóc nhè', 'Đi ngủ'], 'Tung hứng')]
  }},
  { id: 't2-b23', title: 'Bài 23: Kiến và bồ câu', pageNumber: 92, volume: 2, type: 'story', content: {
      words: ['thợ săn', 'nhanh trí'],
      paragraphs: ['Kiến cắn vào chân thợ săn để cứu chim bồ câu thoát nạn.'],
      exercises: [createSelectionEx('t2b23', 'Kiến đã giúp ai?', ['Chim bồ câu', 'Con cáo', 'Con sói'], 'Chim bồ câu')]
  }},
  { id: 't2-b24', title: 'Bài 24: Câu chuyện của rễ', pageNumber: 96, volume: 2, type: 'story', content: {
      words: ['âm thầm', 'hút nước'],
      paragraphs: ['Rễ cây nằm sâu dưới đất, âm thầm hút nước nuôi cây xanh lá.'],
      exercises: [createSelectionEx('t2b24', 'Rễ cây nằm ở đâu?', ['Dưới đất', 'Trên cành', 'Trong hoa'], 'Dưới đất')]
  }},
  { id: 't2-b25', title: 'Bài 25: Ôn tập và kể chuyện', pageNumber: 100, volume: 2, type: 'review', content: {
      paragraphs: ['Thế giới quanh em có thật nhiều điều thú vị đang chờ khám phá.'],
      exercises: [createSelectionEx('t2b25', 'Rễ cây giúp cây điều gì?', ['Hút nước nuôi cây', 'Làm cây ngã', 'Nở hoa'], 'Hút nước nuôi cây')]
  }},
  { id: 't2-b26', title: 'Bài 26: Bác Hồ với thiếu nhi', pageNumber: 104, volume: 2, type: 'story', content: {
      words: ['yêu thương', 'non sông'],
      paragraphs: ['Bác Hồ rất yêu các cháu thiếu nhi Việt Nam.'],
      exercises: [createSelectionEx('t2b26', 'Bác Hồ yêu quý ai nhất?', ['Thiếu nhi', 'Người lớn', 'Vật nuôi'], 'Thiếu nhi')]
  }},
  { id: 't2-b27', title: 'Bài 27: Chuyện ở lớp', pageNumber: 108, volume: 2, type: 'story', content: {
      words: ['giảng bài', 'nghe lời'],
      paragraphs: ['Ở lớp, cô giáo giảng bài say sưa. Chúng em chăm chú lắng nghe.'],
      exercises: [createSelectionEx('t2b27', 'Ai giảng bài cho bé ở lớp?', ['Cô giáo', 'Chú bảo vệ', 'Bác lái xe'], 'Cô giáo')]
  }},
  { id: 't2-b28', title: 'Bài 28: Lăng Bác', pageNumber: 112, volume: 2, type: 'story', content: {
      words: ['trang nghiêm', 'viếng thăm'],
      paragraphs: ['Lăng Bác nằm giữa Quảng trường Ba Đình lịch sử.'],
      exercises: [createSelectionEx('t2b28', 'Lăng Bác ở đâu?', ['Quảng trường Ba Đình', 'Sân chơi', 'Công viên'], 'Quảng trường Ba Đình')]
  }},
  { id: 't2-b29', title: 'Bài 29: Việt Nam quê hương ta', pageNumber: 116, volume: 2, type: 'story', content: {
      words: ['tươi đẹp', 'tự hào'],
      paragraphs: ['Đất nước Việt Nam tươi đẹp với biển bạc rừng vàng.'],
      exercises: [createSelectionEx('t2b29', 'Quê hương chúng ta tên là gì?', ['Việt Nam', 'Nhật Bản', 'Hàn Quốc'], 'Việt Nam')]
  }},
  { id: 't2-b30', title: 'Bài 30: Ôn tập và kể chuyện', pageNumber: 120, volume: 2, type: 'review', content: {
      paragraphs: ['Chúng em tự hào là người con đất Việt.'],
      exercises: [createSelectionEx('t2b30', 'Đất nước Việt Nam như thế nào?', ['Tươi đẹp', 'Xấu xí', 'Nhỏ bé'], 'Tươi đẹp')]
  }},
  { id: 't2-b31', title: 'Bài 31: Cây liễu dẻo dai', pageNumber: 124, volume: 2, type: 'story', content: {
      words: ['mềm mại', 'soi bóng'],
      paragraphs: ['Cây liễu bên hồ có tán lá mềm mại soi bóng xuống nước.'],
      exercises: [createSelectionEx('t2b31', 'Cây liễu mọc ở đâu?', ['Bên hồ', 'Trong nhà', 'Trên gác'], 'Bên hồ')]
  }},
  { id: 't2-b32', title: 'Bài 32: Bác trống trường', pageNumber: 128, volume: 2, type: 'story', content: {
      words: ['tùng tùng', 'nghỉ hè'],
      paragraphs: ['Suốt ba tháng hè, bác trống nằm yên trong lớp vắng.'],
      exercises: [createSelectionEx('t2b32', 'Tiếng trống trường kêu như thế nào?', ['Tùng tùng', 'Bíp bíp', 'Kính coong'], 'Tùng tùng')]
  }},
  { id: 't2-b33', title: 'Bài 33: Mưa', pageNumber: 132, volume: 2, type: 'story', content: {
      words: ['lộp bộp', 'tưới mát'],
      paragraphs: ['Mưa rơi lộp bộp trên mái lá, tưới mát cho cỏ cây.'],
      exercises: [createSelectionEx('t2b33', 'Tiếng mưa rơi như thế nào?', ['Lộp bộp', 'Xào xạc', 'Ầm ầm'], 'Lộp bộp')]
  }},
  { id: 't2-b34', title: 'Bài 34: Mặt trời và hạt đậu', pageNumber: 136, volume: 2, type: 'story', content: {
      words: ['tỉnh giấc', 'vươn vai'],
      paragraphs: ['Hạt đậu tỉnh giấc khi thấy ánh nắng ấm áp của mặt trời.'],
      exercises: [createSelectionEx('t2b34', 'Ai đánh thức hạt đậu?', ['Mặt trời', 'Cơn gió', 'Đám mây'], 'Mặt trời')]
  }},
  { id: 't2-b35', title: 'Bài 35: Ôn tập cuối năm', pageNumber: 140, volume: 2, type: 'review', content: {
      paragraphs: ['Chào lớp 1 thân yêu, chúng em lên lớp 2.'],
      exercises: [createSelectionEx('t2b35', 'Năm sau bé lên lớp mấy?', ['Lớp 2', 'Lớp 3', 'Lớp 4'], 'Lớp 2')]
  }},
];

export const LESSONS: Lesson[] = [...GENERATED_LESSONS_V1, ...GENERATED_LESSONS_V2];

export const NAV_ITEMS = [
  { id: AppView.HOME, label: 'Trang chủ', icon: <Home size={24} /> },
  { id: AppView.READING, label: 'Tập đọc', icon: <BookOpen size={24} /> },
  { id: AppView.WRITING, label: 'Tập viết', icon: <PenTool size={24} /> },
  { id: AppView.EXERCISE, label: 'Vận dụng', icon: <Trophy size={24} /> },
  { id: AppView.CREATIVE, label: 'Sáng tạo', icon: <Sparkles size={24} /> },
  { id: AppView.CHAT, label: 'Hỏi AI', icon: <MessageCircle size={24} /> },
  { id: AppView.TEACHER_DASHBOARD, label: 'Giáo viên', icon: <BarChart3 size={24} /> },
  { id: AppView.PARENT_DASHBOARD, label: 'Phụ huynh', icon: <Heart size={24} /> },
];

export const APP_THEMES: AppTheme[] = [
  { primaryColor: '#f97316', secondaryColor: '#fed7aa', backgroundColor: '#fff7ed', fontFamily: 'system-ui' },
  { primaryColor: '#2563eb', secondaryColor: '#bfdbfe', backgroundColor: '#eff6ff', fontFamily: 'system-ui' },
  { primaryColor: '#059669', secondaryColor: '#a7f3d0', backgroundColor: '#f0fdf4', fontFamily: 'system-ui' },
  { primaryColor: '#7c3aed', secondaryColor: '#ddd6fe', backgroundColor: '#f5f3ff', fontFamily: 'system-ui' },
];

export const WRITING_EXERCISES: WritingExercise[] = [
  { id: 'w1', category: 'Chữ cái', label: 'a', text: 'a', videoUrl: 'https://www.youtube.com/embed/S_B7_P-Rk3c' },
  { id: 'w2', category: 'Chữ cái', label: 'b', text: 'b', videoUrl: 'https://www.youtube.com/embed/5F2v_p4S4jU' },
  { id: 'w3', category: 'Chữ cái', label: 'c', text: 'c', videoUrl: 'https://www.youtube.com/embed/z8_D0y9Z8yA' },
  { id: 'w4', category: 'Chữ cái', label: 'd', text: 'd', videoUrl: 'https://www.youtube.com/embed/j_8z_Z7Z_yA' },
  { id: 'w5', category: 'Chữ cái', label: 'đ', text: 'đ', videoUrl: 'https://www.youtube.com/embed/j_8z_Z7Z_yA' },
  { id: 'w6', category: 'Chữ cái', label: 'e', text: 'e' },
  { id: 'w7', category: 'Chữ cái', label: 'ê', text: 'ê' },
  { id: 'w8', category: 'Vần', label: 'ai', text: 'ai' },
  { id: 'w9', category: 'Vần', label: 'oi', text: 'oi' },
  { id: 'w10', category: 'Từ ngữ', label: 'ba bà', text: 'ba bà' },
  { id: 'w11', category: 'Từ ngữ', label: 'cá cờ', text: 'cá cờ' },
  { id: 'w12', category: 'Từ ngữ', label: 'đi bộ', text: 'đi bộ' },
];

export const CREATIVE_TOOLS = [
  { id: 'gen-image', title: 'Vẽ tranh AI', description: 'Tạo hình ảnh minh họa từ lời kể của bé.', icon: <ImageIcon size={32} /> },
  { id: 'gen-video', title: 'Tạo Video AI', description: 'Biến câu kể thành thước phim sinh động.', icon: <Film size={32} /> },
];
