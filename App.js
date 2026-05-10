import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  RefreshControl,
  AppState,
  Linking
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as MediaLibrary from 'expo-media-library';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LinearGradient } from 'expo-linear-gradient';
import { getLocales } from 'expo-localization';
import { AdBanner } from './components/ads';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');
const DEV = typeof __DEV__ !== 'undefined' && __DEV__;
const devLog = (...args) => {
  if (DEV) console.log(...args);
};
const devWarn = (...args) => {
  if (DEV) console.warn(...args);
};

// 翻訳データ
const translations = {
  en: {
    Dark: 'Dark',
    White: 'White',
    Ocean: 'Ocean',
    Sunset: 'Sunset',
    Forest: 'Forest',
    Rose: 'Rose',
    Lavender: 'Lavender',
    Oak: 'Oak',
    PhotoFrame: 'Photo Frame',
    Settings: 'Settings',
    Gallery: 'Gallery',
    SelectPhoto: 'Select Photo',
    SavePhoto: 'Save Photo',
    Cancel: 'Cancel',
    Confirm: 'Confirm',
    Loading: 'Loading...',
    NoPhotos: 'No photos found',
    'app.close': 'Close',
    'app.title': 'Photo Frame',
    'app.settings': 'Settings',
    'app.selectPhotos': 'Selected: {{count}} photos',
    'settings.changeLanguage': 'Change Language',
    'loading.initializing': 'Initializing...',
    'loading.photos': 'Loading photos...',
    'button.retry': 'Retry',
    'button.understand': 'I understand',
    'button.startSlideshow': '🎬 Start Slideshow',
    'hint.swipeDown': 'Swipe down to see more',
    'loading.morePhotos': 'Loading more photos...',
    'settings.matteColor': 'Color',
    'settings.slideshowInterval': 'Slideshow Interval',
    'settings.language': 'Language',
    'settings.seconds': '{{count}}s',
    'settings.minutes': '{{count}}m',
    'settings.dark': 'Dark',
    'settings.white': 'White',
    'settings.ocean': 'Ocean',
    'settings.sunset': 'Sunset',
    'settings.forest': 'Forest',
    'settings.rose': 'Rose',
    'settings.lavender': 'Lavender',
    'settings.oak': 'Oak',
    'settings.clockAndDateDisplay': 'Clock & Date Display',

    'label.clockOn': 'Clock On',
    'label.clockOff': 'Clock Off',
    'label.dateOn': 'Date On',
    'label.dateOff': 'Date Off',
    'label.on': 'On',
    'label.off': 'Off',
    'settings.clockDateSize': 'Clock & Date Size',
    'label.sizeSmall': 'Small',
    'label.sizeMedium': 'Medium',
    'label.sizeLarge': 'Large',

    'permission.title': '📷 Photo Access',
    'permission.message': 'To allow PhotoFrame to access photos, enable photo permissions in your device settings.',
    'alert.languageChanged.title': 'Language Changed',
    'alert.languageChanged.message': 'Language set to {{language}}',
    'lang.en': 'English',
    'lang.ja': 'Japanese',
    'lang.zh': 'Chinese',
    'lang.es': 'Spanish',
    'alert.selectPhotos.title': 'Select Photos',
    'alert.selectPhotos.message': 'Select at least one photo before starting the slideshow.',
    'app.help': 'Help',
    'help.about': 'About',
    'help.usage': 'Usage Guide',
    'help.usageContent': '1. Select photos from the list.\n2. Tap "Start Slideshow" button.\n3. Customize settings like interval and clock display in the Settings menu.\n4. Enjoy your photos!\n\nTap the screen during slideshow to see controls.',
    'help.version': 'Version',
    'help.contact': 'Contact',
    'help.legal': 'Legal',
    'help.privacyPolicy': 'Privacy Policy',
    'help.termsOfService': 'Terms of Service',
    'help.back': 'Back',
    'help.viewOnline': 'View details online',
    'help.privacyPolicyContent': 'We prioritize your privacy above all. This app operates entirely locally on your device to display your photos. Your photos are never uploaded to any server or shared with third parties.\n\nTo keep this app free, we use Google AdMob for advertising. AdMob may use anonymous identifiers to serve relevant ads. By using this app, you agree to this standard practice.',
    'help.termsOfServiceContent': 'Thank you for using PhotoFrame. This app is provided "as available" to help you enjoy your photos. While we strive for perfection, the developer cannot be held liable for any issues arising from its use. Please use responsibly.'
  },
  ja: {
    Dark: 'ダーク',
    White: 'ホワイト',
    Ocean: '海',
    Sunset: '夕焼け',
    Forest: '森',
    Rose: 'ローズ',
    Lavender: 'ラベンダー',
    Oak: 'オーク',
    PhotoFrame: 'フォトフレーム',
    Settings: '設定',
    Gallery: 'ギャラリー',
    SelectPhoto: '写真を選択',
    SavePhoto: '写真を保存',
    Cancel: 'キャンセル',
    Confirm: '確認',
    Loading: '読み込み中...',
    NoPhotos: '写真が見つかりません',
    'app.close': '閉じる',
    'app.title': 'フォトフレーム',
    'app.settings': '設定',
    'app.selectPhotos': '選択中: {{count}}枚',
    'settings.changeLanguage': '言語を変更',
    'loading.initializing': '初期化中...',
    'loading.photos': '写真を読み込み中...',
    'button.retry': '再試行',
    'button.understand': '了解',
    'button.startSlideshow': '🎬 スライドショー開始',
    'hint.swipeDown': 'もっと見るには下にスワイプしてください',
    'loading.morePhotos': '追加の写真を読み込み中...',
    'settings.matteColor': 'カラー',
    'settings.slideshowInterval': 'スライドショー間隔',
    'settings.language': '言語',
    'settings.seconds': '{{count}}秒',
    'settings.minutes': '{{count}}分',
    'settings.dark': 'ダーク',
    'settings.white': 'ホワイト',
    'settings.ocean': '海',
    'settings.sunset': '夕焼け',
    'settings.forest': '森',
    'settings.rose': 'ローズ',
    'settings.lavender': 'ラベンダー',
    'settings.oak': 'オーク',
    'settings.clockAndDateDisplay': '時計・日付表示',

    'label.clockOn': '時計オン',
    'label.clockOff': '時計オフ',
    'label.dateOn': '日付オン',
    'label.dateOff': '日付オフ',
    'label.on': 'オン',
    'label.off': 'オフ',
    'settings.clockDateSize': '時計・日付の文字サイズ',
    'label.sizeSmall': '小サイズ',
    'label.sizeMedium': '中サイズ',
    'label.sizeLarge': '大サイズ',

    'permission.title': '📷 写真へのアクセス',
    'permission.message': 'PhotoFrameアプリが写真にアクセスするには、端末の設定で写真へのアクセス権限を許可してください。',
    'alert.languageChanged.title': '言語変更',
    'alert.languageChanged.message': '言語を{{language}}に設定しました',
    'lang.en': '英語',
    'lang.ja': '日本語',
    'lang.zh': '中国語',
    'lang.es': 'スペイン語',
    'alert.selectPhotos.title': '写真を選択してください',
    'alert.selectPhotos.message': '最低1枚の写真を選択してからスライドショーを開始してください。',
    'app.help': 'ヘルプ',
    'help.about': 'アプリについて',
    'help.usage': '使い方ガイド',
    'help.usageContent': '1. 一覧から写真を選択します。\n2. 「スライドショー開始」ボタンをタップします。\n3. 設定メニューでスライドショーの間隔や時計表示などをカスタマイズできます。\n4. フォトフレームをお楽しみください！\n\nスライドショー中に画面をタップすると操作ボタンが表示されます。',
    'help.version': 'バージョン',
    'help.contact': 'お問い合わせ',
    'help.legal': '法的事項',
    'help.privacyPolicy': 'プライバシーポリシー',
    'help.termsOfService': '利用規約',
    'help.back': '戻る',
    'help.viewOnline': 'オンラインで詳細を見る',
    'help.privacyPolicyContent': 'このアプリは、ユーザーの個人データを収集しません。アプリ内で写真を表示するためにのみ、デバイスの写真ライブラリにアクセスします。写真がいかなるサーバーにもアップロードされることはありません。\n\nただし、広告表示のためにAdMob（Google）を使用しています。AdMobは、広告のパーソナライズのためにデータを収集し、Cookie/識別子を使用する場合があります。このアプリを使用することで、このデータ使用に同意したものとみなされます。',
    'help.termsOfServiceContent': 'このアプリは現在の状態で提供され、動作の完全性を保証するものではありません。開発者は、このアプリの使用から生じるいかなる損害についても責任を負いません。お客様は、適用されるすべての法律に従い、責任を持ってアプリを使用することに同意するものとします。'
  },
  zh: {
    Dark: '深色',
    White: '白色',
    Ocean: '海洋',
    Sunset: '日落',
    Forest: '森林',
    Rose: '玫瑰',
    Lavender: '薰衣草',
    Oak: '橡木',
    PhotoFrame: '相框',
    Settings: '设置',
    Gallery: '图库',
    SelectPhoto: '选择照片',
    SavePhoto: '保存照片',
    Cancel: '取消',
    Confirm: '确认',
    Loading: '加载中...',
    NoPhotos: '未找到照片',
    'app.close': '关闭',
    'app.title': '相框',
    'app.settings': '设置',
    'app.selectPhotos': '已选择：{{count}} 张照片',
    'settings.changeLanguage': '更改语言',
    'loading.initializing': '初始化中...',
    'loading.photos': '正在加载照片...',
    'button.retry': '重试',
    'button.understand': '知道了',
    'button.startSlideshow': '🎬 开始幻灯片',
    'hint.swipeDown': '向下滑动查看更多',
    'loading.morePhotos': '正在加载更多照片...',
    'settings.matteColor': '颜色',
    'settings.slideshowInterval': '幻灯片间隔',
    'settings.language': '语言',
    'settings.seconds': '{{count}}秒',
    'settings.minutes': '{{count}}分钟',
    'settings.dark': '深色',
    'settings.white': '白色',
    'settings.ocean': '海洋',
    'settings.sunset': '日落',
    'settings.forest': '森林',
    'settings.rose': '玫瑰',
    'settings.lavender': '薰衣草',
    'settings.oak': '橡木',
    'settings.clockAndDateDisplay': '时钟与日期显示',

    'label.clockOn': '时钟开启',
    'label.clockOff': '时钟关闭',
    'label.dateOn': '日期开启',
    'label.dateOff': '日期关闭',
    'label.on': '开启',
    'label.off': '关闭',
    'settings.clockDateSize': '时钟与日期字体大小',
    'label.sizeSmall': '小',
    'label.sizeMedium': '中',
    'label.sizeLarge': '大',

    'permission.title': '📷 照片访问',
    'permission.message': '要允许 PhotoFrame 访问照片，请在设备设置中启用照片权限。',
    'alert.languageChanged.title': '语言更改',
    'alert.languageChanged.message': '语言已设置为 {{language}}',
    'lang.en': '英语',
    'lang.ja': '日语',
    'lang.zh': '中文',
    'lang.es': '西班牙语',
    'alert.selectPhotos.title': '请选择照片',
    'alert.selectPhotos.message': '开始幻灯片之前请至少选择一张照片。',
    'app.help': '帮助',
    'help.about': '关于应用',
    'help.usage': '使用指南',
    'help.usageContent': '1. 从列表中选择照片。\n2. 点击“开始幻灯片”按钮。\n3. 在设置菜单中自定义幻灯片间隔和时钟显示。\n4. 尽情享受您的数码相框！\n\n幻灯片播放时点击屏幕可显示控制按钮。',
    'help.version': '版本',
    'help.contact': '联系方式',
    'help.legal': '法律',
    'help.privacyPolicy': '隐私政策',
    'help.termsOfService': '服务条款',
    'help.back': '返回',
    'help.viewOnline': '在线查看详情',
    'help.privacyPolicyContent': '我们将您的隐私视为重中之重。此应用程序完全在您的设备本地运行以显示您的照片。您的照片绝不会上传到任何服务器或与第三方共享。\n\n为了保持此应用程序免费，我们使用 Google AdMob 进行广告宣传。AdMob 可能会使用匿名标识符来展示相关广告。使用此应用程序即表示您同意此标准做法。',
    'help.termsOfServiceContent': '感谢您使用 PhotoFrame。本应用程序按“现状”提供，以帮助您欣赏照片。虽然我们力求完美，但开发者不对因使用本应用程序而产生的任何问题负责。请负责任地使用。'
  },
  es: {
    Dark: 'Oscuro',
    White: 'Blanco',
    Ocean: 'Océano',
    Sunset: 'Atardecer',
    Forest: 'Bosque',
    Rose: 'Rosa',
    Lavender: 'Lavanda',
    Oak: 'Roble',
    PhotoFrame: 'Marco de Fotos',
    Settings: 'Ajustes',
    Gallery: 'Galería',
    SelectPhoto: 'Seleccionar foto',
    SavePhoto: 'Guardar foto',
    Cancel: 'Cancelar',
    Confirm: 'Confirmar',
    Loading: 'Cargando...',
    NoPhotos: 'No se encontraron fotos',
    'app.close': 'Cerrar',
    'app.title': 'Marco de Fotos',
    'app.settings': 'Ajustes',
    'app.selectPhotos': 'Seleccionadas: {{count}} fotos',
    'settings.changeLanguage': 'Cambiar idioma',
    'loading.initializing': 'Inicializando...',
    'loading.photos': 'Cargando fotos...',
    'button.retry': 'Reintentar',
    'button.understand': 'Entendido',
    'button.startSlideshow': '🎬 Iniciar presentación',
    'hint.swipeDown': 'Desliza hacia abajo para ver más',
    'loading.morePhotos': 'Cargando más fotos...',
    'settings.matteColor': 'Color',
    'settings.slideshowInterval': 'Intervalo de presentación',
    'settings.language': 'Idioma',
    'settings.seconds': '{{count}} s',
    'settings.minutes': '{{count}} min',
    'settings.dark': 'Oscuro',
    'settings.white': 'Blanco',
    'settings.ocean': 'Océano',
    'settings.sunset': 'Atardecer',
    'settings.forest': 'Bosque',
    'settings.rose': 'Rosa',
    'settings.lavender': 'Lavanda',
    'settings.oak': 'Roble',
    'settings.clockAndDateDisplay': 'Mostrar reloj y fecha',

    'label.clockOn': 'Reloj activado',
    'label.clockOff': 'Reloj desactivado',
    'label.dateOn': 'Fecha activada',
    'label.dateOff': 'Fecha desactivada',
    'label.on': 'Activado',
    'label.off': 'Desactivado',
    'settings.clockDateSize': 'Tamaño de reloj y fecha',
    'label.sizeSmall': 'Pequeño',
    'label.sizeMedium': 'Mediano',
    'label.sizeLarge': 'Grande',

    'permission.title': '📷 Acceso a fotos',
    'permission.message': 'Para permitir que PhotoFrame acceda a las fotos, habilita los permisos de fotos en la configuración del dispositivo.',
    'alert.languageChanged.title': 'Idioma cambiado',
    'alert.languageChanged.message': 'Idioma establecido a {{language}}',
    'lang.en': 'Inglés',
    'lang.ja': 'Japonés',
    'lang.zh': 'Chino',
    'lang.es': 'Español',
    'alert.selectPhotos.title': 'Selecciona fotos',
    'alert.selectPhotos.message': 'Selecciona al menos una foto antes de iniciar la presentación.',
    'app.help': 'Ayuda',
    'help.about': 'Acerca de',
    'help.usage': 'Guía de uso',
    'help.usageContent': '1. Selecciona fotos de la lista.\n2. Toca el botón "Iniciar presentación".\n3. Personaliza el intervalo y el reloj en el menú de Ajustes.\n4. ¡Disfruta de tu marco de fotos!\n\nToca la pantalla durante la presentación para ver los controles.',
    'help.version': 'Versión',
    'help.contact': 'Contacto',
    'help.legal': 'Legal',
    'help.privacyPolicy': 'Política de Privacidad',
    'help.termsOfService': 'Términos de Uso',
    'help.back': 'Volver',
    'help.viewOnline': 'Ver detalles en línea',
    'help.privacyPolicyContent': 'Valoramos su privacidad por encima de todo. Esta aplicación funciona completamente de forma local en su dispositivo para mostrar sus fotos. Sus fotos nunca se suben a ningún servidor ni se comparten con terceros.\n\nPara mantener esta aplicación gratuita, utilizamos Google AdMob para la publicidad. AdMob puede utilizar identificadores anónimos para ofrecer anuncios relevantes. Al utilizar esta aplicación, usted acepta esta práctica estándar.',
    'help.termsOfServiceContent': 'Gracias por usar PhotoFrame. Esta aplicación se proporciona "tal como está" para ayudarle a disfrutar de sus fotos. Aunque nos esforzamos por la perfección, el desarrollador no se hace responsable de ningún problema derivado de su uso. Por favor, utilícela responsablemente.'
  }
};

// マットカラーの定義
const matteColors = {
  dark: '#000000',
  white: '#FFFFFF',
  ocean: '#006994',
  sunset: '#FF6B35',
  forest: '#2D5016',
  rose: '#8B4B6B',
  lavender: '#967BB6',
  oak: '#8B4513'
};

// マットカラーのグラデーション定義
const matteGradients = {
  dark: ['#000000', '#333333'],
  white: ['#FFFFFF', '#E0E0E0'],
  // トップはより深く、ボトムはやや深めのカラーに調整
  ocean: ['#003a57', '#3d9ec0'],
  sunset: ['#CC4E1D', '#E07F52'],
  forest: ['#1E3A0F', '#6FBF5E'],
  rose: ['#6A3952', '#B77395'],
  lavender: ['#70589A', '#A793D4'],
  oak: ['#5E2F0D', '#B8875A']
};

export default function App() {
  // デバイスの言語設定に基づいて初期言語を決定する関数
  const getInitialLanguage = () => {
    try {
      const locales = getLocales();
      if (locales && locales.length > 0) {
        const languageCode = locales[0].languageCode;
        // サポートしている言語コードの場合、その言語を返す
        if (['ja', 'es', 'zh'].includes(languageCode)) {
          return languageCode;
        }
      }
    } catch (e) {
      devWarn('Failed to get device locale', e);
    }
    // デフォルトまたはサポート外の場合は英語
    return 'en';
  };

  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage());
  const [photos, setPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [matteColor, setMatteColor] = useState('dark');
  const [slideshowInterval, setSlideshowInterval] = useState(3000);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState(null);

  const [screenOrientation, setScreenOrientation] = useState('portrait');
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [photoGridWidth, setPhotoGridWidth] = useState(width);

  const [showClock, setShowClock] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [now, setNow] = useState(new Date());
  const [showCloseButton, setShowCloseButton] = useState(true);
  // 時計・日付サイズ（small | medium | large）。現在の組み合わせを「medium」とする
  const [clockDateSize, setClockDateSize] = useState('medium');
  
  // ヘルプ画面の表示セクション状態 ('main' | 'privacy' | 'terms')
  const [helpSection, setHelpSection] = useState('main');

  const slideshowTimer = useRef(null);
  const slideshowStartTimeout = useRef(null);
  const closeButtonTimer = useRef(null);

  // 時計・日付のフォーマット関数
  const formatTime = () => {
    const d = now;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const formatDate = () => {
    const d = now;
    const localeMap = { en: 'en-US', ja: 'ja-JP', zh: 'zh-CN', es: 'es-ES' };
    const locale = localeMap[currentLanguage] || 'en-US';
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
    const dateStr = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    return `${dateStr} (${weekday})`;
  };

  // 画面遷移時の回転解除関数（シンプル版）
  const unlockOrientationOnTransition = () => {
    // OSの自動回転に任せるため何もしない
  };

  // 動的スタイルを生成
  const styles = getStyles(screenOrientation, clockDateSize);
  const gridHorizontalPadding = screenOrientation === 'landscape' ? 20 : 10;
  const gridItemMargin = 4;
  const usablePhotoGridWidth = Math.max(
    photoGridWidth - gridHorizontalPadding * 2,
    screenOrientation === 'landscape' ? 480 : 320
  );
  const preferredPhotoCellWidth = screenOrientation === 'landscape' ? 150 : 120;
  const photoColumns = Math.max(
    3,
    Math.floor(usablePhotoGridWidth / preferredPhotoCellWidth)
  );
  const photoItemSize = Math.floor(
    usablePhotoGridWidth / photoColumns
  ) - gridItemMargin
  ;
  const normalizedPhotoItemSize = Math.max(
    screenOrientation === 'landscape' ? 96 : 90,
    photoItemSize
  );

  // 翻訳関数
  const t = (key, params) => {
    let text = translations[currentLanguage][key] || key;
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(`{{${param}}}`, params[param]);
      });
    }
    return text;
  };

  // 画面の向きを監視（シンプル版）
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setScreenOrientation(width > height ? 'landscape' : 'portrait');
    };
    updateOrientation();
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenOrientation(window.width > window.height ? 'landscape' : 'portrait');
    });
    return () => {
      if (typeof sub?.remove === 'function') {
        sub.remove();
      }
    };
  }, []);

  // スライドショー画面での回転強制を撤去（シンプル化）
  useEffect(() => {
    // 何もしない：OSの回転に任せる
  }, [showSlideshow]);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowStartupSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  // 設定画面での回転強制を撤去（シンプル化）
  useEffect(() => {
    // 何もしない：OSの回転に任せる
  }, [showSettings]);

  // ヘルプ画面が表示されたときにセクションをリセット
  useEffect(() => {
    if (showHelp) {
      setHelpSection('main');
    }
  }, [showHelp]);

  // 権限の確認と写真の読み込み
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        await loadPhotos();
      }
    })().catch((error) => {
      console.error('Permission request failed:', error);
      setHasPermission(false);
    });
  }, []);

  // 写真の読み込み
  const loadPhotos = async (loadMore = false) => {
    if (loading || (!hasNextPage && loadMore)) return;
    
    setLoading(true);
    try {
      const options = {
        first: 20,
        mediaType: 'photo',
        sortBy: 'creationTime',
      };
      
      if (loadMore && endCursor) {
        options.after = endCursor;
      }
      
      const result = await MediaLibrary.getAssetsAsync(options);
      devLog('Loaded photos:', result.assets.length);
      
      // 画像の詳細情報を取得
      const photosWithInfo = await Promise.all(
        result.assets.map(async (asset) => {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
            return {
              ...asset,
              uri: assetInfo.localUri || assetInfo.uri || asset.uri,
              width: assetInfo.width,
              height: assetInfo.height
            };
          } catch (error) {
            devWarn('Failed to get asset info for:', asset.id, error);
            return asset;
          }
        })
      );
      
      if (loadMore) {
        setPhotos(prev => [...prev, ...photosWithInfo]);
      } else {
        setPhotos(photosWithInfo);
      }
      
      setHasNextPage(result.hasNextPage);
      setEndCursor(result.endCursor);
    } catch (error) {
      console.error('Error loading photos:', error);
      // エラーが発生してもアプリを停止させない
      setHasNextPage(false);
      
      // デモ用のサンプル画像を追加（Expo Goでテスト用）
      if (DEV && photos.length === 0) {
        const samplePhotos = [
          {
            id: 'sample1',
            uri: 'https://picsum.photos/300/300?random=1',
            width: 300,
            height: 300,
            filename: 'sample1.jpg'
          },
          {
            id: 'sample2', 
            uri: 'https://picsum.photos/300/300?random=2',
            width: 300,
            height: 300,
            filename: 'sample2.jpg'
          },
          {
            id: 'sample3',
            uri: 'https://picsum.photos/300/300?random=3',
            width: 300,
            height: 300,
            filename: 'sample3.jpg'
          }
        ];
        setPhotos(samplePhotos);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 写真の選択/選択解除
  const togglePhotoSelection = (photo) => {
    setSelectedPhotos(prev => {
      const isSelected = prev.some(p => p.id === photo.id);
      if (isSelected) {
        return prev.filter(p => p.id !== photo.id);
      } else {
        return [...prev, photo];
      }
    });

  };

  // スライドショーの開始
  const startSlideshow = async () => {
    try {
      if (selectedPhotos.length === 0) {
        Alert.alert(t('alert.selectPhotos.title'), t('alert.selectPhotos.message'));
        return;
      }
      
      // 選択された写真が有効なURIを持っているか確認
      const validPhotos = selectedPhotos.filter(photo => photo.uri && photo.uri.length > 0);
      
      if (validPhotos.length === 0) {
        Alert.alert('エラー', '選択された写真を読み込めませんでした。別の写真を選択してください。');
        return;
      }
      
      // 既存のタイマーをクリア
      if (slideshowTimer.current) {
        clearInterval(slideshowTimer.current);
        slideshowTimer.current = null;
      }
      
      // スライドショー状態を設定
      setCurrentSlideIndex(0);
      setShowSlideshow(true);
      setShowCloseButton(true);
      
      // 終了ボタンの自動非表示タイマーを設定
      closeButtonTimer.current = setTimeout(() => {
        setShowCloseButton(false);
      }, 5000);
      
      // スライドショータイマーを設定（複数の写真がある場合のみ）
      if (validPhotos.length > 1) {
        // 少し遅延させてから開始（状態更新を確実にするため）
        slideshowStartTimeout.current = setTimeout(() => {
          slideshowTimer.current = setInterval(() => {
            setCurrentSlideIndex(prev => {
              const nextIndex = (prev + 1) % validPhotos.length;
              return nextIndex;
            });
          }, slideshowInterval);
        }, 1000); // 1秒の遅延で確実に開始
      }
    } catch (error) {
      if (DEV) {
        console.error('Error starting slideshow:', error);
      } else {
        console.error('Error starting slideshow');
      }
      
      Alert.alert('エラー', 'スライドショーの開始に失敗しました。もう一度お試しください。');
      
      // エラー時のクリーンアップ
      setShowSlideshow(false);
      if (slideshowTimer.current) {
        clearInterval(slideshowTimer.current);
        slideshowTimer.current = null;
      }
      if (slideshowStartTimeout.current) {
        clearTimeout(slideshowStartTimeout.current);
        slideshowStartTimeout.current = null;
      }
    }
  };

  // スライドショーの停止
  const stopSlideshow = async () => {
    try {
      setShowSlideshow(false);
      
      // タイマーをクリア
      if (slideshowTimer.current) {
        clearInterval(slideshowTimer.current);
        slideshowTimer.current = null;
      }
      
      // 遅延開始タイマーもクリア
      if (slideshowStartTimeout.current) {
        clearTimeout(slideshowStartTimeout.current);
        slideshowStartTimeout.current = null;
      }
      
      // 終了ボタンタイマーもクリア
      if (closeButtonTimer.current) {
        clearTimeout(closeButtonTimer.current);
        closeButtonTimer.current = null;
      }
      
      // 終了ボタンの表示状態をリセット
      setShowCloseButton(true);
    } catch (error) {
      if (DEV) {
        console.error('Error stopping slideshow:', error);
      } else {
        console.error('Error stopping slideshow');
      }
      // エラーが発生してもスライドショーは確実に停止
      setShowSlideshow(false);
      if (slideshowTimer.current) {
        clearInterval(slideshowTimer.current);
        slideshowTimer.current = null;
      }
      if (slideshowStartTimeout.current) {
        clearTimeout(slideshowStartTimeout.current);
        slideshowStartTimeout.current = null;
      }
      if (closeButtonTimer.current) {
        clearTimeout(closeButtonTimer.current);
        closeButtonTimer.current = null;
      }
      setShowCloseButton(true);
    }
  };

  // スライドショーのタイマー管理はstartSlideshow/stopSlideshow関数で行う
  // useEffectでのタイマー管理は無効化（重複を防ぐため）

  // 終了ボタンの表示/非表示制御
  const handleSlideshowTouch = () => {
    if (!showCloseButton) {
      setShowCloseButton(true);
      
      // 既存のタイマーをクリア
      if (closeButtonTimer.current) {
        clearTimeout(closeButtonTimer.current);
        closeButtonTimer.current = null;
      }
      
      // 新しいタイマーを設定
      closeButtonTimer.current = setTimeout(() => {
        setShowCloseButton(false);
      }, 5000);
    } else {
      // 既に表示されている場合はタイマーをリセット
      if (closeButtonTimer.current) {
        clearTimeout(closeButtonTimer.current);
      }
      closeButtonTimer.current = setTimeout(() => {
        setShowCloseButton(false);
      }, 5000);
    }
  };

  // 言語変更
  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    
    // 変更後の言語リソースを直接取得してアラートを表示
    // (state更新は非同期のため、t()を使うと更新前の言語で表示されてしまうため)
    const newLangData = translations[lang];
    const title = newLangData['alert.languageChanged.title'] || 'Language Changed';
    const languageName = newLangData[`lang.${lang}`] || lang;
    let message = newLangData['alert.languageChanged.message'] || 'Language set to {{language}}';
    
    message = message.replace('{{language}}', languageName);
    
    Alert.alert(title, message);
  };

  // CSS メディアクエリを使用した画面回転対応（Web環境用）
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        @media screen and (orientation: landscape) {
          .slideshow-container {
            flex-direction: row !important;
          }
          .slideshow-image {
            max-width: 90% !important;
            max-height: 90% !important;
          }
        }
        @media screen and (orientation: portrait) {
          .slideshow-container {
            flex-direction: column !important;
          }
          .slideshow-image {
            max-width: 95% !important;
            max-height: 85% !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  // 時計更新タイマー
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 写真アイテムのレンダリング
  const renderPhotoItem = ({ item }) => {
    const isSelected = selectedPhotos.some(p => p.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.photoItem,
          { width: normalizedPhotoItemSize, height: normalizedPhotoItemSize },
          isSelected && styles.selectedPhoto
        ]}
        onPress={() => togglePhotoSelection(item)}
      >
        <Image 
          source={{ uri: item.uri }} 
          style={styles.photoThumbnail}
          onError={(error) => {
            devWarn('Image load error for:', item.id, error);
          }}
          defaultSource={require('./assets/icon.png')}
        />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
        <View style={styles.photoInfo}>
          <Text style={styles.photoInfoText} numberOfLines={1}>
            {item.filename || `Photo ${item.id}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 設定画面のレンダリング
  const renderSettings = () => (
    <Modal visible={showSettings} animationType="slide" supportedOrientations={['portrait','portrait-upside-down','landscape','landscape-left','landscape-right']}>
      <LinearGradient
        colors={matteGradients[matteColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.settingsContainer}
      >
        <SafeAreaView style={styles.settingsContent}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>{t('Settings')}</Text>
            <TouchableOpacity onPress={() => {
              setShowSettings(false);
            }}>
              <Text style={styles.closeButton}>{t('app.close')}</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.settingsScroll}>
            {/* 言語設定 */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>{t('settings.language')}</Text>
              <View style={styles.languageButtons}>
                 {['en', 'ja', 'zh', 'es'].map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.languageButton,
                      matteColor === 'white' && { backgroundColor: 'rgba(0,0,0,0.2)' },
                      currentLanguage === lang && styles.activeLanguageButton
                    ]}
                    onPress={() => changeLanguage(lang)}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      currentLanguage === lang && styles.activeLanguageButtonText
                    ]}>
                      {t(`lang.${lang}`)}
                    </Text>
                  </TouchableOpacity>
                ))}

              </View>
            </View>
            
            {/* マットカラー設定 */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>{t('settings.matteColor')}</Text>
              <View style={styles.colorGrid}>
                {Object.keys(matteColors).map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: matteColors[color] },
                      matteColor === color && styles.activeColorButton
                    ]}
                    onPress={() => setMatteColor(color)}
                  >
                    <Text style={[
                      styles.colorButtonText,
                      color === 'white' ? { color: '#000' } : { color: '#fff' }
                    ]}>
                      {t(`settings.${color}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* スライドショー間隔設定 */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>{t('settings.slideshowInterval')}</Text>
              <View style={styles.intervalButtons}>
                {[3000, 180000, 1800000, 10800000].map(interval => (
                  <TouchableOpacity
                    key={interval}
                    style={[
                      styles.intervalButton,
                      matteColor === 'white' && { backgroundColor: 'rgba(0,0,0,0.2)' },
                      slideshowInterval === interval && styles.activeIntervalButton
                    ]}
                    onPress={() => {
                      setSlideshowInterval(interval);
                    }}
                  >
                    <Text style={[
                      styles.intervalButtonText,
                      slideshowInterval === interval && styles.activeIntervalButtonText
                    ]}>
                      {interval % 60000 === 0
                        ? t('settings.minutes', { count: Math.round(interval / 60000) })
                        : t('settings.seconds', { count: Math.round(interval / 1000) })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 時計・日付表示 */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>{t('settings.clockAndDateDisplay')}</Text>
              <View style={styles.languageButtons}>
                {/* 時計：1アイテムでオン/オフ切替 */}
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    matteColor === 'white' && { backgroundColor: 'rgba(0,0,0,0.2)' },
                    showClock && styles.activeLanguageButton
                  ]}
                  onPress={() => setShowClock((prev) => !prev)}
                >
                  <Text style={[styles.languageButtonText, showClock && styles.activeLanguageButtonText]}>
                    {showClock ? t('label.clockOn') : t('label.clockOff')}
                  </Text>
                </TouchableOpacity>

                {/* 日付：1アイテムでオン/オフ切替 */}
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    matteColor === 'white' && { backgroundColor: 'rgba(0,0,0,0.2)' },
                    showDate && styles.activeLanguageButton
                  ]}
                  onPress={() => setShowDate((prev) => !prev)}
                >
                  <Text style={[styles.languageButtonText, showDate && styles.activeLanguageButtonText]}>
                    {showDate ? t('label.dateOn') : t('label.dateOff')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>


            {/* 時計・日付の文字サイズ */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>{t('settings.clockDateSize')}</Text>
              <View style={styles.languageButtons}>
                {['small', 'medium', 'large'].map(sz => (
                  <TouchableOpacity
                    key={sz}
                    style={[
                      styles.languageButton,
                      matteColor === 'white' && { backgroundColor: 'rgba(0,0,0,0.2)' },
                      clockDateSize === sz && styles.activeLanguageButton
                    ]}
                    onPress={() => setClockDateSize(sz)}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      clockDateSize === sz && styles.activeLanguageButtonText
                    ]}>
                      {sz === 'small' ? t('label.sizeSmall') : sz === 'medium' ? t('label.sizeMedium') : t('label.sizeLarge')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Banner Ad - settings screen */}
            <AdBanner style={{ marginTop: 10 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );

  // ヘルプ画面のレンダリング
  const renderHelp = () => (
    <Modal visible={showHelp} animationType="slide" supportedOrientations={['portrait','portrait-upside-down','landscape','landscape-left','landscape-right']}>
      <LinearGradient
        colors={matteGradients[matteColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.settingsContainer}
      >
        <SafeAreaView style={styles.settingsContent}>
          <View style={styles.settingsHeader}>
            {helpSection === 'main' ? (
              <>
                <Text style={styles.settingsTitle}>{t('app.help')}</Text>
                <TouchableOpacity onPress={() => setShowHelp(false)}>
                  <Text style={styles.closeButton}>{t('app.close')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.settingsTitle}>
                  {helpSection === 'privacy' ? t('help.privacyPolicy') : t('help.termsOfService')}
                </Text>
                <TouchableOpacity onPress={() => setHelpSection('main')}>
                  <Text style={styles.closeButton}>{t('help.back')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <ScrollView style={styles.settingsScroll}>
            {helpSection === 'main' ? (
              <>
                {/* 使い方ガイド */}
                <View style={styles.settingSection}>
                  <Text style={styles.settingLabel}>{t('help.usage')}</Text>
                  <Text style={{ color: '#fff', fontSize: 16, lineHeight: 24, paddingHorizontal: 10 }}>
                    {t('help.usageContent')}
                  </Text>
                </View>

                {/* バージョン情報 */}
                <View style={styles.settingSection}>
                  <Text style={styles.settingLabel}>{t('help.about')}</Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 16, marginBottom: 5 }}>
                      {t('app.title')}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                      {t('help.version')}: 1.0.0 (Beta)
                    </Text>
                  </View>
                </View>

                {/* 法的事項 */}
                <View style={styles.settingSection}>
                  <Text style={styles.settingLabel}>{t('help.legal')}</Text>
                  <View style={styles.languageButtons}>
                    <TouchableOpacity
                      style={[styles.languageButton, matteColor === 'white' && { backgroundColor: 'rgba(0,0,0,0.2)' }]}
                      onPress={() => setHelpSection('privacy')}
                    >
                      <Text style={styles.languageButtonText}>{t('help.privacyPolicy')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.languageButton, matteColor === 'white' && { backgroundColor: 'rgba(0,0,0,0.2)' }]}
                      onPress={() => setHelpSection('terms')}
                    >
                      <Text style={styles.languageButtonText}>{t('help.termsOfService')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ padding: 15 }}>
                <Text style={{ color: '#fff', fontSize: 16, lineHeight: 24 }}>
                  {helpSection === 'privacy' ? t('help.privacyPolicyContent') : t('help.termsOfServiceContent')}
                </Text>
                
                <TouchableOpacity
                  style={{ 
                    marginTop: 20, 
                    padding: 12, 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    borderRadius: 8, 
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center'
                  }}
                  onPress={() => {
                    const url = helpSection === 'privacy' 
                      ? 'https://nysnr.github.io/PhotoFrameNew/privacy.html' 
                      : 'https://nysnr.github.io/PhotoFrameNew/terms.html';
                    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                    {t('help.viewOnline')} 🌐
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Banner Ad - help screen */}
            <AdBanner style={{ marginTop: 10 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );

  // 次のスライドに進む関数
  const nextSlide = () => {
    if (selectedPhotos.length > 1) {
      setCurrentSlideIndex(prev => {
        const nextIndex = (prev + 1) % selectedPhotos.length;
        // 手動切り替え時の回転解除はiOSではスキップ

        return nextIndex;
      });
    }
  };

  // 前のスライドに戻る関数
  const prevSlide = () => {
    if (selectedPhotos.length > 1) {
      setCurrentSlideIndex(prev => {
        const prevIndex = prev === 0 ? selectedPhotos.length - 1 : prev - 1;
        return prevIndex;
      });
    }
  };

  // 画像の最適なresizeModeを決定する関数
  const getOptimalResizeMode = (photo) => {
    if (!photo || !photo.width || !photo.height) {
      return 'contain';
    }
    
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const photoAspectRatio = photo.width / photo.height;
    const screenAspectRatio = screenWidth / screenHeight;
    
    // 画面の向きと写真の向きを考慮してより適切な表示モードを選択
    if (screenOrientation === 'landscape') {
      // 横向き画面の場合
      if (photoAspectRatio > screenAspectRatio * 0.8) {
        // 写真が画面の比率に近い、または横長の場合
        return 'contain';
      } else {
        // 縦長の写真の場合、画面を最大限活用
        return 'cover';
      }
    } else {
      // 縦向き画面の場合
      if (photoAspectRatio < screenAspectRatio * 1.2) {
        // 写真が画面の比率に近い、または縦長の場合
        return 'contain';
      } else {
        // 横長の写真の場合、画面を最大限活用
        return 'cover';
      }
    }
  };

  // スライドショー画面のレンダリング（修正版）
  const renderSlideshow = () => {
    // スライドショーが表示されていない場合は何も表示しない
    if (!showSlideshow || selectedPhotos.length === 0) {
      return null;
    }
    
    const currentPhoto = selectedPhotos[currentSlideIndex];
    const resizeMode = 'contain';
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const maxW = screenOrientation === 'portrait' ? screenWidth * 0.95 : screenWidth * 0.90;
    const maxH = screenOrientation === 'portrait' ? screenHeight * 0.85 : screenHeight * 0.90;
    let frameW = maxW;
    let frameH = maxH;
    if (currentPhoto?.width && currentPhoto?.height) {
      const scale = Math.min(maxW / currentPhoto.width, maxH / currentPhoto.height);
      frameW = Math.round(currentPhoto.width * scale);
      frameH = Math.round(currentPhoto.height * scale);
    }
    
    return (
      <Modal 
        visible={showSlideshow} 
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={stopSlideshow}
        supportedOrientations={['portrait','portrait-upside-down','landscape','landscape-left','landscape-right']}
      >
        <TouchableOpacity
          style={styles.slideshowTouchArea}
          onPress={handleSlideshowTouch}
          activeOpacity={1}
        >
          <LinearGradient
             colors={matteGradients[matteColor]}
             start={{ x: 0, y: 0 }}
             end={{ x: 0, y: 1 }}
             style={styles.slideshowContainer}
             className="slideshow-container"
           >
            {showCloseButton && (
              <TouchableOpacity
                style={styles.slideshowCloseButton}
                onPress={stopSlideshow}
              >
                <Text style={styles.slideshowCloseText}>✕</Text>
              </TouchableOpacity>
            )}
          
          {/* 左半分タップで前の画像 */}
          <TouchableOpacity
            style={styles.slideshowLeftArea}
            onPressIn={handleSlideshowTouch}
            onPress={prevSlide}
            activeOpacity={0.3}
          />
          
          {/* 右半分タップで次の画像 */}
          <TouchableOpacity
            style={styles.slideshowRightArea}
            onPressIn={handleSlideshowTouch}
            onPress={nextSlide}
            activeOpacity={0.3}
          />
          
          {currentPhoto && currentPhoto.uri ? (
            <View
              style={[
                styles.slideshowImageFrame,
                {
                  width: frameW,
                  height: frameH,
                },
              ]}
            >
              <Image
                source={{ uri: currentPhoto.uri }}
                className="slideshow-image"
                style={styles.slideshowImage}
                resizeMode={resizeMode}
                onError={(error) => {
                  if (DEV) {
                    console.error('Slideshow image error:', error);
                  } else {
                    console.error('Slideshow image error');
                  }
                  // エラーが発生した場合、次の画像に進む
                  if (selectedPhotos.length > 1) {
                    nextSlide();
                  }
                }}
              />
            </View>
          ) : (
            <View style={styles.slideshowErrorContainer}>
              <Text style={styles.slideshowErrorText}>画像を読み込めませんでした</Text>
              <TouchableOpacity
                style={styles.slideshowNextButton}
                onPressIn={handleSlideshowTouch}
                onPress={nextSlide}
              >
                <Text style={styles.slideshowNextButtonText}>次の画像</Text>
              </TouchableOpacity>
            </View>
          )}
          


          {(showClock || showDate) && (
            <View style={styles.clockOverlay}>
              {showClock && <Text style={styles.clockText}>{formatTime()}</Text>}
              {showDate && <Text style={styles.dateText}>{formatDate()}</Text>}
            </View>
          )}

          {/* Banner Ad - slideshow screen */}
          <AdBanner style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
        </LinearGradient>
        </TouchableOpacity>
        </Modal>
    );
  };



  // 権限がない場合の表示
  if (showStartupSplash) {
    return (
      <View style={styles.startupSplashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Text style={styles.startupSplashText}>PhotoFrame</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <LinearGradient colors={matteGradients[matteColor]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <SafeAreaView style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>{t('permission.title')}</Text>
          <Text style={styles.permissionMessage}>{t('permission.message')}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              MediaLibrary.requestPermissionsAsync().then(({ status }) => {
                setHasPermission(status === 'granted');
                if (status === 'granted') {
                  loadPhotos();
                }
              });
            }}
          >
            <Text style={styles.retryButtonText}>{t('button.retry')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient colors={matteGradients[matteColor]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={matteColors[matteColor]} />
          
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('Gallery')}</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  setShowHelp(true);
                }}
              >
                <Text style={styles.headerButtonText}>❓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  setShowSettings(true);
                }}
              >
                <Text style={styles.headerButtonText}>⚙️</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 選択状況とスライドショーボタン */}
          <View style={styles.controlPanel}>
            <Text style={styles.selectionText}>
              {t('app.selectPhotos', { count: selectedPhotos.length })}
            </Text>
            <TouchableOpacity
              style={[
                styles.slideshowButton,
                selectedPhotos.length === 0 && styles.disabledButton
              ]}
              onPress={startSlideshow}
              disabled={selectedPhotos.length === 0}
            >
              <Text style={styles.slideshowButtonText}>
                {t('button.startSlideshow')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* 写真ギャラリー */}
          {hasPermission === null ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>{t('loading.initializing')}</Text>
            </View>
          ) : (
            <FlatList
              key={`photo-grid-${photoColumns}`}
              data={photos}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id}
              numColumns={photoColumns}
              style={styles.photoGrid}
              onLayout={(event) => {
                setPhotoGridWidth(event.nativeEvent.layout.width);
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    setEndCursor(null);
                    setHasNextPage(true);
                    loadPhotos();
                  }}
                  tintColor="#fff"
                />
              }
              onEndReached={() => {
                if (hasNextPage && !loading) {
                  loadPhotos(true);
                }
              }}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                loading && hasNextPage ? (
                  <View style={styles.loadingFooter}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.loadingText}>{t('loading.morePhotos')}</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                !loading && hasPermission === true ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('NoPhotos')}</Text>
                  </View>
                ) : null
              }
              removeClippedSubviews={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}
          
          {/* Banner Ad - gallery/selection screen */}
          <AdBanner />
          
          {renderSettings()}
          {renderHelp()}
          {renderSlideshow()}

        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

  // 動的スタイル生成関数
  const getStyles = (screenOrientation, clockDateSize) => StyleSheet.create({
    container: {
      flex: 1,
      minHeight: '100%',
      minWidth: '100%',
    },
    startupSplashContainer: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    startupSplashText: {
      color: '#fff',
      fontSize: 36,
      fontWeight: '700',
      letterSpacing: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: screenOrientation === 'landscape' ? 40 : 20,
      paddingVertical: screenOrientation === 'landscape' ? 10 : 15,
      flexWrap: 'wrap',
    },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 15,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  selectionText: {
    color: '#fff',
    fontSize: 16,
  },
  slideshowButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  slideshowButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  photoGrid: {
    flex: 1,
    paddingHorizontal: screenOrientation === 'landscape' ? 20 : 10,
    paddingVertical: screenOrientation === 'landscape' ? 10 : 5,
  },
  photoItem: {
    margin: 2,
    position: 'relative',
  },
  selectedPhoto: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 設定画面のスタイル
  settingsContainer: {
    flex: 1,
  },
  settingsContent: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenOrientation === 'landscape' ? 40 : 20,
    paddingVertical: screenOrientation === 'landscape' ? 10 : 15,
    flexWrap: 'wrap',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  settingsScroll: {
    flex: 1,
    paddingHorizontal: screenOrientation === 'landscape' ? 40 : 20,
    paddingVertical: screenOrientation === 'landscape' ? 10 : 0,
  },
  settingSection: {
    marginBottom: screenOrientation === 'landscape' ? 20 : 30,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  languageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: screenOrientation === 'landscape' ? 'flex-start' : 'center',
    gap: screenOrientation === 'landscape' ? 7.5 : 5,
  },
  languageButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 19,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 5,
    marginBottom: 5,
    transform: [{ scaleX: 0.95 }],
  },
  activeLanguageButton: {
    backgroundColor: '#007AFF',
  },
  languageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeLanguageButtonText: {
    color: '#fff',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorButton: {
    width: ((width - 60) / 4) * 0.95,
    height: 60,
    margin: 2.5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeColorButton: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  colorButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  intervalButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  activeIntervalButton: {
    backgroundColor: '#007AFF',
  },
  intervalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeIntervalButtonText: {
    color: '#fff',
  },
  // スライドショー画面のスタイル
  slideshowContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideshowTouchArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  slideshowCloseButton: {
    position: 'absolute',
    top: screenOrientation === 'landscape' ? 20 : 50,
    right: screenOrientation === 'landscape' ? 30 : 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideshowCloseText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  slideshowImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  slideshowImageFrame: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  slideshowImagePortrait: {
    maxWidth: '95%',
    maxHeight: '85%',
  },
  slideshowImageLandscape: {
    maxWidth: '90%',
    maxHeight: '90%',
  },
  slideshowLeftArea: {
    position: 'absolute',
    left: 0,
    top: screenOrientation === 'landscape' ? 60 : 100,
    bottom: 0,
    width: '50%',
    zIndex: 2,
  },
  slideshowRightArea: {
    position: 'absolute',
    right: 0,
    top: screenOrientation === 'landscape' ? 60 : 100,
    bottom: 0,
    width: '40%',
    zIndex: 2,
  },
  slideshowIndicator: {
    position: 'absolute',
    bottom: screenOrientation === 'landscape' ? 20 : 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    zIndex: 3,
  },
  slideshowIndicatorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  slideshowHint: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 8,
    zIndex: 3,
  },
  slideshowHintText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  // 時計・日付オーバーレイのスタイル
  clockOverlay: {
    position: 'absolute',
    bottom: screenOrientation === 'landscape' ? 20 : 50,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 5,
    alignItems: 'center',
  },
  clockText: {
    color: '#fff',
    fontSize: (screenOrientation === 'landscape' ? 96 : 108) * (clockDateSize === 'small' ? 0.5 : clockDateSize === 'medium' ? 0.7 : 2.0),
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  dateText: {
    color: '#fff',
    fontSize: (screenOrientation === 'landscape' ? 54 : 60) * (clockDateSize === 'small' ? 0.5 : clockDateSize === 'medium' ? 0.8 : 2.0),
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // 警告モーダルのスタイル
  warningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningModal: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    maxWidth: 350,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  warningMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // スライドショーエラー表示のスタイル
  slideshowErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideshowErrorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  slideshowNextButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  slideshowNextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 写真情報表示のスタイル
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  photoInfoText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  });
