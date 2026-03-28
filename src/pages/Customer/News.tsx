import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  Search,
  Tag,
  X,
} from "lucide-react";

type Category = { id: string; name: string; count: number };
type Article = {
  id: number;
  title: string;
  excerpt: string;
  content: string; // paragraphs separated by double newline
  highlights?: string[]; // short bullet highlights
  moreImages?: string[]; // extra images displayed inside modal
  category: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  tags: string[];
  featured: boolean;
};

const categories: Category[] = [
  { id: "all", name: "Tất cả", count: 12 },
  { id: "promotion", name: "Khuyến mãi", count: 4 },
  { id: "guide", name: "Hướng dẫn", count: 3 },
  { id: "news", name: "Tin tức", count: 5 },
];

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const newsData: Article[] = [
    {
      id: 1,
      title:
        "Khuyến mãi lớn mùa du lịch hè 2024 - Giảm đến 30% cho tất cả các tuyến",
      excerpt:
        "Chương trình khuyến mãi đặc biệt dành cho khách hàng đặt vé trước từ 7-15 ngày.",
      content:
        "Nhân dịp hè, CoachTrip tung chương trình ưu đãi giảm đến 30% cho nhiều tuyến.\n\nÁp dụng cho các vé mua trước 7-15 ngày, có giới hạn số lượng mỗi ngày. Khuyến mãi kết hợp với các mã giảm giá khác tùy điều kiện.\n\nHướng dẫn áp dụng: chọn tuyến, chọn ngày, tích chọn mã ưu đãi (nếu có). Xác nhận thanh toán để hoàn tất đặt vé.",
      highlights: [
        "Giảm tới 30%",
        "Áp dụng cho nhiều tuyến phổ biến",
        "Thời gian có hạn",
      ],
      moreImages: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200",
      ],
      category: "promotion",
      date: "2024-03-10",
      author: "Nguyễn Văn A",
      readTime: "3 phút",
      image:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=600&fit=crop",
      tags: ["Khuyến mãi", "Du lịch hè", "Giảm giá"],
      featured: true,
    },
    {
      id: 2,
      title: "Hướng dẫn đặt vé xe khách trực tuyến nhanh chóng và dễ dàng",
      excerpt:
        "Cách thức đặt vé xe khách online chỉ trong 5 phút với các bước đơn giản.",
      content:
        "Chuẩn bị thông tin: họ tên, số điện thoại, điểm đi/đến.\n\nBước 1: Chọn tuyến và ngày khởi hành.\n\nBước 2: Chọn chỗ (nếu hệ thống hỗ trợ).\n\nBước 3: Xác nhận và thanh toán. Bạn sẽ nhận vé điện tử qua email hoặc SMS.",
      highlights: [
        "Nhanh 5 phút",
        "Hỗ trợ thanh toán đa dạng",
        "Xác nhận tức thì",
      ],
      moreImages: [
        "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200",
      ],
      category: "guide",
      date: "2024-03-08",
      author: "Trần Thị B",
      readTime: "5 phút",
      image:
        "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&h=600&fit=crop",
      tags: ["Hướng dẫn", "Đặt vé online", "Tutorial"],
      featured: false,
    },
    {
      id: 3,
      title: "Ra mắt tuyến xe mới Hà Nội - Đà Nẵng với xe giường nằm cao cấp",
      excerpt:
        "Tuyến mới được trang bị giường nằm 40 chỗ, wifi miễn phí và dịch vụ cao cấp.",
      content:
        "Tuyến Hà Nội - Đà Nẵng chính thức khai trương với lịch chạy hàng ngày.\n\nXe giường nằm 40 chỗ, có màn hình giải trí, wifi, và phục vụ đồ ăn nhẹ.\n\nHành khách được hưởng chính sách ưu đãi mở tuyến trong tháng đầu.",
      highlights: [
        "Giường nằm cao cấp",
        "Wifi miễn phí",
        "Màn hình giải trí cá nhân",
      ],
      moreImages: [
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200",
      ],
      category: "news",
      date: "2024-03-07",
      author: "Lê Văn C",
      readTime: "4 phút",
      image:
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200&h=600&fit=crop",
      tags: ["Tuyến mới", "Xe giường nằm", "Cao cấp"],
      featured: true,
    },
    {
      id: 4,
      title: "Chính sách hoàn vé và đổi vé linh hoạt cho khách hàng",
      excerpt:
        "Tìm hiểu chính sách hoàn vé: điều kiện, phí và bước thực hiện khi cần thay đổi kế hoạch.",
      content:
        "Chúng tôi hiểu kế hoạch có thể thay đổi — chính sách hoàn/đổi vé được thiết kế linh hoạt.\n\nHoàn vé: yêu cầu gửi trước hạn chót, phí xử lý tùy thời điểm.\n\nĐổi vé: có thể đổi ngày/chuyến tùy vào chỗ trống; một số trường hợp được hỗ trợ miễn phí.",
      highlights: ["Hỗ trợ trong nhiều tình huống", "Quy trình rõ ràng"],
      category: "guide",
      date: "2024-03-05",
      author: "Phạm Thị D",
      readTime: "6 phút",
      image:
        "https://plus.unsplash.com/premium_photo-1684407617014-711a4eebe612?q=80&w=1200&auto=format&fit=crop",
      tags: ["Chính sách", "Hoàn vé", "Hỗ trợ"],
      featured: false,
    },
    {
      id: 5,
      title: "Mã giảm giá đặc biệt cho khách hàng thân thiết tháng 3",
      excerpt: "Ưu đãi 20% cho khách hàng đã dùng dịch vụ từ 3 lần trở lên.",
      content:
        "Chương trình dành cho khách hàng thân thiết: đạt mốc lượt đặt vé để nhận mã giảm.\n\nCách nhận: hệ thống tự động gửi mã qua email khi đạt điều kiện.\n\nLưu ý: mã có thời hạn và không áp dụng đồng thời với một số khuyến mãi khác.",
      category: "promotion",
      date: "2024-03-03",
      author: "Hoàng Văn E",
      readTime: "2 phút",
      image:
        "https://plus.unsplash.com/premium_photo-1670509045675-af9f249b1bbe?q=80&w=1200&auto=format&fit=crop",
      tags: ["Mã giảm giá", "Khách hàng thân thiết", "Ưu đãi"],
      featured: false,
    },
    {
      id: 6,
      title: "Hướng dẫn quy trình gửi hàng qua CoachTrip",
      excerpt:
        "Hướng dẫn từng bước cách đóng gói, khai báo và gửi hàng an toàn qua hệ thống vận chuyển của chúng tôi.",
      content:
        "1) Chuẩn bị hàng hoá: kiểm tra trọng lượng, kích thước và tính chất hàng (hàng dễ vỡ, dễ cháy...).\n\n2) Đóng gói an toàn: sử dụng vật liệu chống sốc, bọc nhiều lớp với góc cạnh được gia cố. Dán nhãn 'Hàng dễ vỡ' nếu cần.\n\n3) Khai báo thông tin: điền đầy đủ tên người gửi/nhận, số điện thoại, địa chỉ, mô tả hàng hóa và giá trị khai báo. Kiểm tra mã vận đơn trước khi xác nhận.\n\n4) Đặt lịch gửi và thanh toán: chọn điểm gửi hoặc đặt thu gom, chọn dịch vụ phù hợp (giao nhanh/tiêu chuẩn), thanh toán trực tuyến hoặc tại điểm gửi.\n\n5) Giao nhận và theo dõi: nhận biên nhận/mã vận đơn; theo dõi trạng thái vận chuyển qua trang 'Theo dõi đơn hàng' hoặc mã vận đơn được gửi qua SMS/Email.\n\n6) Lưu ý và chính sách: hàng cấm/đặc biệt không được vận chuyển. Trong trường hợp mất/hư hỏng, làm theo quy trình khiếu nại và cung cấp biên lai/ảnh chụp để xử lý khiếu nại.",
      highlights: [
        "Chuẩn bị và đóng gói đúng cách",
        "Khai báo đầy đủ thông tin người gửi/nhận",
        "Chọn dịch vụ phù hợp (giao nhanh/tiêu chuẩn)",
        "Theo dõi và lưu giữ mã vận đơn",
      ],
      moreImages: [
        "https://images.unsplash.com/photo-1724709162875-fe100dd0e04b?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1572675339312-3e8b094a544d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      category: "guide",
      date: "2024-03-01",
      author: "Nguyễn Văn H",
      readTime: "6 phút",
      image:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=600&fit=crop",
      tags: ["Gửi hàng", "Vận chuyển", "Hướng dẫn"],
      featured: false,
    },
    {
      id: 7,
      title: "Khám phá 10 tuyến đường du lịch hot nhất mùa xuân",
      excerpt:
        "Gợi ý tuyến du lịch mùa xuân với cảnh đẹp, lịch trình và mẹo đặt vé tiết kiệm.",
      content:
        "Mùa xuân là thời điểm lý tưởng để đi phượt ngắn và thư giãn.\n\nDanh sách 10 tuyến được tổng hợp dựa trên lượt tìm kiếm và phản hồi khách hàng.\n\nMẹo: đặt vé sớm để có chỗ tốt và tận dụng khuyến mãi đầu mùa.",
      highlights: [
        "10 tuyến gợi ý",
        "Mẹo đặt vé tiết kiệm",
        "Thời gian thích hợp đi",
      ],
      moreImages: [
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200",
      ],
      category: "news",
      date: "2024-02-28",
      author: "Đặng Văn G",
      readTime: "7 phút",
      image:
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=600&fit=crop",
      tags: ["Du lịch", "Mùa xuân", "Gợi ý"],
      featured: true,
    },
    {
      id: 8,
      title: "Ứng dụng di động CoachTrip - Đặt vé mọi lúc mọi nơi",
      excerpt:
        "Tải ứng dụng CoachTrip để đặt vé, quản lý lịch trình và nhận khuyến mãi sớm nhất.",
      content:
        "Ứng dụng cho phép đặt vé nhanh, lưu thông tin hành khách và theo dõi trạng thái chuyến.\n\nTải trên iOS và Android; đăng ký để nhận thông báo khuyến mãi đặc biệt.",
      category: "news",
      date: "2024-02-25",
      author: "Bùi Thị H",
      readTime: "3 phút",
      image:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=600&fit=crop",
      tags: ["App mobile", "Công nghệ", "Tiện ích"],
      featured: false,
    },
  ];

  // Search: split searchTerm into words and require each word to be present in the title (simple, no libs)
  const filteredNews = newsData.filter((news) => {
    const matchCategory =
      selectedCategory === "all" || news.category === selectedCategory;

    const q = searchTerm.trim().toLowerCase();
    if (!q) return matchCategory;

    const words = q.split(/\s+/).filter(Boolean);
    const title = news.title.toLowerCase();

    const allWordsInTitle = words.every((w) => title.includes(w));
    return matchCategory && allWordsInTitle;
  });

  const featuredNews = filteredNews.filter((n) => n.featured);
  const regularNews = filteredNews.filter((n) => !n.featured);

  const openArticle = (a: Article) => setSelectedArticle(a);
  const closeModal = () => setSelectedArticle(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (selectedArticle) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedArticle]);

  return (
    <div className="min-h-screen pt-[72px] bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tin Tức & Khuyến Mãi
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Cập nhật thông tin mới nhất về dịch vụ xe khách, khuyến mãi hấp
              dẫn và hướng dẫn sử dụng nền tảng
            </p>

            {/* Search Bar (title-word search) */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm theo từng chữ trong tiêu đề (ví dụ: 'du lịch hè')"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-300 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="bg-white border-b sticky top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between overflow-x-auto">
            <div className="flex space-x-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-6 py-2 rounded-full font-medium transition whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured News */}
      {selectedCategory === "all" && featuredNews.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900">Tin nổi bật</h3>
              <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-orange-500 to-transparent rounded"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {featuredNews.slice(0, 2).map((news) => (
                <article
                  key={news.id}
                  onClick={() => openArticle(news)}
                  className="cursor-pointer group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden h-64">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Nổi bật
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-orange-500" />
                        {new Date(news.date).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-orange-500" />
                        {news.readTime}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition line-clamp-2">
                      {news.title}
                    </h4>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {news.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1 text-orange-500" />
                        {news.author}
                      </div>
                      <div className="flex items-center text-sm text-orange-600 font-semibold">
                        Xem chi tiết
                        <ArrowRight className="w-4 h-4 ml-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular News Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {selectedCategory !== "all" && (
            <div className="flex items-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900">
                {categories.find((c) => c.id === selectedCategory)?.name}
              </h3>
              <div className="ml-4 h-1 flex-1 bg-gradient-to-r from-orange-500 to-transparent rounded"></div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularNews.map((news) => (
              <article
                key={news.id}
                onClick={() => openArticle(news)}
                className="cursor-pointer group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative overflow-hidden h-48">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md ${
                        news.category === "promotion"
                          ? "bg-red-500"
                          : news.category === "guide"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                    >
                      {categories.find((c) => c.id === news.category)?.name}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-orange-500" />
                      {new Date(news.date).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-orange-500" />
                      {news.readTime}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition line-clamp-2">
                    {news.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {news.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {news.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="flex items-center text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center text-orange-600 font-semibold text-sm">
                    Xem chi tiết
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không tìm thấy tin tức
              </h3>
              <p className="text-gray-600">
                Vui lòng thử tìm kiếm với từ khóa khác
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Modal: show full article (image scrolls with content) */}
      {selectedArticle && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-start md:items-center justify-center p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={selectedArticle.title}
        >
          <div
            className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 z-20"
              onClick={closeModal}
              aria-label="Đóng"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Header image is now part of the scrollable content */}
            <div className="w-full h-auto md:h-auto">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full object-cover max-h-[50vh]"
                style={{ height: "auto" }}
              />
            </div>

            {/* Content area (no independent scroll, modal container scrolls) */}
            <div className="p-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {selectedArticle.title}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-orange-500" />
                  {new Date(selectedArticle.date).toLocaleDateString("vi-VN")}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-orange-500" />
                  {selectedArticle.readTime}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1 text-orange-500" />
                  {selectedArticle.author}
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  {selectedArticle.tags.map((t, i) => (
                    <span
                      key={i}
                      className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Render main content paragraphs with improved typography */}
              <div className="prose prose-lg max-w-none text-gray-700 mb-6">
                {selectedArticle.content.split("\n\n").map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {/* Highlights (bulleted) */}
              {selectedArticle.highlights &&
                selectedArticle.highlights.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Điểm nổi bật</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {selectedArticle.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Extra image gallery within modal */}
              {selectedArticle.moreImages &&
                selectedArticle.moreImages.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Hình ảnh liên quan</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedArticle.moreImages.map((src, i) => (
                        <div key={i} className="h-40 overflow-hidden rounded">
                          <img
                            src={src}
                            alt={`${selectedArticle.title} - ${i}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Related articles */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Bài viết liên quan</h4>
                <div className="space-y-2">
                  {newsData
                    .filter(
                      (a) =>
                        a.category === selectedArticle.category &&
                        a.id !== selectedArticle.id
                    )
                    .slice(0, 3)
                    .map((rel) => (
                      <button
                        key={rel.id}
                        onClick={() => openArticle(rel)}
                        className="w-full text-left p-3 rounded hover:bg-gray-50 flex items-start gap-3"
                      >
                        <img
                          src={rel.image}
                          alt={rel.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {rel.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(rel.date).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <div className="text-sm text-gray-600 mr-auto">Chia sẻ:</div>
                <button className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">
                  Facebook
                </button>
                <button className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm">
                  Twitter
                </button>
                <button
                  onClick={closeModal}
                  className="px-5 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
