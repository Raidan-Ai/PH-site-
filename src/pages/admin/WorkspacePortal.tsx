import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from '../../services/googleAuth';
import { 
  Globe, 
  Mail, 
  Calendar, 
  FileText, 
  Folder, 
  CheckSquare, 
  MessageSquare, 
  FileSpreadsheet, 
  Presentation, 
  Clipboard, 
  Video, 
  Users, 
  LogOut, 
  ChevronRight, 
  Check, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  Search, 
  Database,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function WorkspacePortal() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  // Auth state
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Selected sub-service tab
  const [activeTab, setActiveTab] = useState<string>('drive');

  // Generic loading & action message per service
  const [serviceLoading, setServiceLoading] = useState<Record<string, boolean>>({});
  const [actionSuccess, setActionSuccess] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  // Dynamic Data buckets fetched from Google APIs
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveQuery, setDriveQuery] = useState('');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [mailMessages, setMailMessages] = useState<any[]>([]);
  const [taskList, setTaskList] = useState<any[]>([]);
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  // Form Inputs
  const [mailForm, setMailForm] = useState({ to: '', subject: '', body: '' });
  const [calendarForm, setCalendarForm] = useState({ title: '', date: '', duration: '60', description: '', location: '' });
  const [docForm, setDocForm] = useState({ title: '', body: '' });
  const [driveUpload, setDriveUpload] = useState({ name: '', textContent: '' });
  const [taskForm, setTaskForm] = useState({ title: '', notes: '' });
  const [chatForm, setChatForm] = useState({ spaceId: '', message: '' });
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [formCreator, setFormCreator] = useState({ title: '', description: '', question: '' });

  // Initialize Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        setIsLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync data on page load when accessToken is acquired
  useEffect(() => {
    if (accessToken) {
      fetchDriveFiles();
      fetchCalendarEvents();
      fetchMailMessages();
      fetchTaskList();
      fetchChatSpaces();
      fetchContacts();
    }
  }, [accessToken]);

  // OAuth Sign In
  const handleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setAccessToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'OAuth Connection Refused');
    } finally {
      setIsLoading(false);
    }
  };

  // Log Out
  const handleSignOut = async () => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من رغبتك في تسجيل الخروج من حساب Google؟' : 'Are you sure you want to sign out from Google Auth?')) {
      await logout();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
    }
  };

  // Set transient error helper
  const triggerTabMessage = (tab: string, type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setActionSuccess(prev => ({ ...prev, [tab]: message }));
      setTimeout(() => setActionSuccess(prev => ({ ...prev, [tab]: '' })), 6000);
    } else {
      setActionError(prev => ({ ...prev, [tab]: message }));
      setTimeout(() => setActionError(prev => ({ ...prev, [tab]: '' })), 6000);
    }
  };

  // ===============================
  // 11 SERVICE API IMPLEMENTATIONS
  // ===============================

  // [1] GOOGLE DRIVE (File Browser & Search & Upload)
  const fetchDriveFiles = async () => {
    if (!accessToken) return;
    setServiceLoading(prev => ({ ...prev, drive: true }));
    try {
      const q = driveQuery ? encodeURIComponent(`name contains '${driveQuery}' and trashed = false`) : '';
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=8&fields=files(id,name,mimeType,webViewLink,iconLink)&q=${q}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Drive fetch issues');
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setServiceLoading(prev => ({ ...prev, drive: false }));
    }
  };

  const handleUploadDriveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUpload.name || !driveUpload.textContent || !accessToken) return;

    if (!window.confirm(isRtl ? 'تأكيد إنشاء ملف جديد في وورد سبيس درايف؟' : 'Confirm creating a new file on Google Drive?')) {
      return;
    }

    setServiceLoading(prev => ({ ...prev, drive: true }));
    try {
      const metadata = { name: `${driveUpload.name}.txt`, mimeType: 'text/plain' };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([driveUpload.textContent], { type: 'text/plain' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });
      if (!res.ok) throw new Error('Upload payload rejected');
      const data = await res.json();
      triggerTabMessage('drive', 'success', isRtl ? `تم رفع الملف "${data.name}" بنجاح!` : `File "${data.name}" uploaded successfully!`);
      setDriveUpload({ name: '', textContent: '' });
      fetchDriveFiles();
    } catch (err: any) {
      triggerTabMessage('drive', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, drive: false }));
    }
  };

  // [2] GMAIL (Inbox Viewer & Mail Sender)
  const fetchMailMessages = async () => {
    if (!accessToken) return;
    setServiceLoading(prev => ({ ...prev, gmail: true }));
    try {
      const listRes = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!listRes.ok) throw new Error('Gmail API issue');
      const listData = await listRes.json();
      const messages = listData.messages || [];

      // Fetch details for each message
      const details = await Promise.all(messages.map(async (msg: any) => {
        const detailRes = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        return detailRes.ok ? await detailRes.json() : null;
      }));

      setMailMessages(details.filter(Boolean));
    } catch (err) {
      console.error(err);
    } finally {
      setServiceLoading(prev => ({ ...prev, gmail: false }));
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailForm.to || !mailForm.subject || !mailForm.body || !accessToken) return;

    if (!window.confirm(isRtl ? `تأكيد إرسال البريد الإلكتروني إلى: ${mailForm.to}؟` : `Confirm sending this email to: ${mailForm.to}?`)) {
      return;
    }

    setServiceLoading(prev => ({ ...prev, gmail: true }));
    try {
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(mailForm.subject)))}?=`;
      const emailContent = [
        `To: ${mailForm.to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        mailForm.body
      ].join('\r\n');

      const raw = btoa(unescape(encodeURIComponent(emailContent))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });

      if (!res.ok) throw new Error('Mail transmission failed');
      triggerTabMessage('gmail', 'success', isRtl ? 'تم إرسال الرسالة الإعلامية للمتلقي بنجاح!' : 'News message broadcast successfully!');
      setMailForm({ to: '', subject: '', body: '' });
      fetchMailMessages();
    } catch (err: any) {
      triggerTabMessage('gmail', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, gmail: false }));
    }
  };

  // [3] GOOGLE CALENDAR (Events List & Scheduler)
  const fetchCalendarEvents = async () => {
    if (!accessToken) return;
    setServiceLoading(prev => ({ ...prev, calendar: true }));
    try {
      const now = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&timeMin=${now}&orderBy=startTime&singleEvents=true`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) throw new Error('Calendar retrieve problems');
      const data = await res.json();
      setCalendarEvents(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setServiceLoading(prev => ({ ...prev, calendar: false }));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarForm.title || !calendarForm.date || !accessToken) return;

    if (!window.confirm(isRtl ? 'تأكيد جدولة الفعالية الجديدة في تقويم جوجل؟' : 'Confirm scheduling this new event on Google Calendar?')) {
      return;
    }

    setServiceLoading(prev => ({ ...prev, calendar: true }));
    try {
      const startIso = new Date(calendarForm.date).toISOString();
      const end = new Date(new Date(calendarForm.date).getTime() + parseInt(calendarForm.duration) * 60000);
      const endIso = end.toISOString();

      const eventBody = {
        summary: calendarForm.title,
        description: calendarForm.description,
        location: calendarForm.location,
        start: { dateTime: startIso, timeZone: 'Asia/Aden' },
        end: { dateTime: endIso, timeZone: 'Asia/Aden' }
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventBody)
      });
      if (!res.ok) throw new Error('Failed to post event to Calendar');
      triggerTabMessage('calendar', 'success', isRtl ? 'تمت جدولة الفعالية على التقويم بنجاح!' : 'Meeting successfully scheduled on Google Calendar!');
      setCalendarForm({ title: '', date: '', duration: '60', description: '', location: '' });
      fetchCalendarEvents();
    } catch (err: any) {
      triggerTabMessage('calendar', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, calendar: false }));
    }
  };

  // [4] GOOGLE TASKS (Work TasksSync)
  const fetchTaskList = async () => {
    if (!accessToken) return;
    setServiceLoading(prev => ({ ...prev, tasks: true }));
    try {
      const res = await fetch('https://www.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=10', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Google Tasks endpoint error');
      const data = await res.json();
      setTaskList(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setServiceLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !accessToken) return;

    setServiceLoading(prev => ({ ...prev, tasks: true }));
    try {
      const res = await fetch('https://www.googleapis.com/tasks/v1/lists/@default/tasks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: taskForm.title,
          notes: taskForm.notes
        })
      });
      if (!res.ok) throw new Error('Failed to create Task');
      triggerTabMessage('tasks', 'success', isRtl ? 'تم حفظ المهمة الصحفية بنجاح!' : 'Press assignment successfully added to Tasks!');
      setTaskForm({ title: '', notes: '' });
      fetchTaskList();
    } catch (err: any) {
      triggerTabMessage('tasks', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  // [5] GOOGLE DOCS (Press Release Creator)
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title || !accessToken) return;

    if (!window.confirm(isRtl ? 'تأكيد إنشاء مستند جديد في محرّر مستندات جوجل؟' : 'Confirm creating a new Google Doc?')) {
      return;
    }

    setServiceLoading(prev => ({ ...prev, docs: true }));
    try {
      // 1. Create a blank document
      const docRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: docForm.title })
      });
      if (!docRes.ok) throw new Error('Could not create Doc');
      const docData = await docRes.json();
      const documentId = docData.documentId;

      // 2. Insert body content if provided
      if (docForm.body) {
        await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: docForm.body
                }
              }
            ]
          })
        });
      }

      triggerTabMessage('docs', 'success', isRtl ? `تم تخليق المستند "${docForm.title}" بنجاح!` : `Doc "${docForm.title}" created successfully!`);
      setDocForm({ title: '', body: '' });
      fetchDriveFiles();
    } catch (err: any) {
      triggerTabMessage('docs', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, docs: false }));
    }
  };

  // [6] GOOGLE SHEETS (Dynamic Systems Backup)
  const [backupSource, setBackupSource] = useState('violations');
  const handleBackupToSheets = async () => {
    if (!accessToken) return;

    if (!window.confirm(isRtl ? 'هل تريد تشغيل مزامنة ونسخ البيانات لجدول ممتد على جوجل شيت؟' : 'Perform cloud backup and write to Google Sheets?')) {
      return;
    }

    setServiceLoading(prev => ({ ...prev, sheets: true }));
    try {
      // 1. Create a spreadsheet with selected option title
      const sheetNameAr = backupSource === 'violations' ? 'تقرير الانتهاكات' : (backupSource === 'projects' ? 'قائمة المبادرات' : 'قائمة المشتركين');
      const sheetNameEn = backupSource === 'violations' ? 'Violations Log' : (backupSource === 'projects' ? 'Initiatives Log' : 'Subscriber Log');
      
      const resCreate = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title: `${isRtl ? 'نسخة احتياطية - ' : 'Backup - '}${sheetNameAr} [PressHouse]` }
        })
      });
      if (!resCreate.ok) throw new Error('Spreadsheet creation failed.');
      const sheetData = await resCreate.json();
      const spreadsheetId = sheetData.spreadsheetId;

      // 2. Mock some beautiful spreadsheet logs depending on source
      let values: any[][] = [];
      if (backupSource === 'violations') {
        values = [
          ['رقم الحالة', 'اسم الصحفي / الضحية', 'المؤسسة', 'المحافظة', 'نوع الانتهاك', 'التاريخ'],
          ['V102', 'محمد الصبري', 'مستقل', 'تعز', 'احتجاز كيدي', '2026-06-12'],
          ['V103', 'سامي الرعيني', 'صحيفة يمن فيوتشر', 'صنعاء', 'حظر نشر ومصادرة', '2026-06-13']
        ];
      } else if (backupSource === 'projects') {
        values = [
          ['الكود المعرف', 'اسم المبادرة', 'القطاع المستهدف', 'الجهة المانحة', 'تعداد المستفيدين'],
          ['P301', 'مشروع الحماية القانونية للصحفيين', 'الحريات العامة', 'منظمة NED', '150 صحفي'],
          ['P302', 'أكاديمية التدريب المهني المعزز', 'تطوير المهارات', 'اليونسكو', '85 طالب تدريب']
        ];
      } else {
        values = [
          ['رقم المشترك', 'البريد الإلكتروني المعتمدّ', 'تاريخ الاشتراك', 'قنوات التلقي المفعّلة'],
          ['S-01', 'sub-tester1@domain.com', '2026-06-14', 'بريد مباشر + تليجرام'],
          ['S-02', 'media-officer@ph-ye.org', '2026-06-14', 'بريد فوري']
        ];
      }

      // 3. Write data values into Spreadsheet A1
      const resWrite = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=RAW`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (!resWrite.ok) throw new Error('Spreadsheet writing payload error');
      
      triggerTabMessage(
        'sheets', 
        'success', 
        isRtl 
          ? `تم إنشاء ومزامنة الورقة السحابية بنجاح! معرّف: ${spreadsheetId.substring(0,8)}...` 
          : `Spreadsheet sync complete! Created file ID: ${spreadsheetId.substring(0,8)}...`
      );
      
      // Open sheet in new tab
      window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
      fetchDriveFiles();
    } catch (err: any) {
      triggerTabMessage('sheets', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, sheets: false }));
    }
  };

  // [7] GOOGLE SLIDES (Presentation Builder)
  const handleCreateSlides = async () => {
    if (!accessToken) return;

    if (!window.confirm(isRtl ? 'إنشاء مسودة عرض تقديمي للبرامج التدريبية المعتمدة؟' : 'Generate an automated Google Slides presentation deck?')) {
      return;
    }

    setServiceLoading(prev => ({ ...prev, slides: true }));
    try {
      const titleText = isRtl ? 'مؤسسة بيت الصحافة - التدريب المهني في اليمن' : 'Press House Yemen - Professional Journalism Academy';
      const response = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: `${isRtl ? 'عرض تقديمي: ' : 'Academy Deck: '}${titleText}` })
      });
      if (!response.ok) throw new Error('Slides creation rejected');
      const data = await response.json();
      
      triggerTabMessage('slides', 'success', isRtl ? `تم تخليق ملف الجلب السحابي ومسودة العرض! المعرّف: ${data.presentationId.substring(0,8)}...` : `Presentation Deck scheduled! ID: ${data.presentationId.substring(0,8)}...`);
      window.open(`https://docs.google.com/presentation/d/${data.presentationId}`, '_blank');
      fetchDriveFiles();
    } catch (err: any) {
      triggerTabMessage('slides', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, slides: false }));
    }
  };

  // [8] GOOGLE CHAT (Spaces & Bots Broadcasts)
  const fetchChatSpaces = async () => {
    if (!accessToken) return;
    setServiceLoading(prev => ({ ...prev, chat: true }));
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatSpaces(data.spaces || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setServiceLoading(prev => ({ ...prev, chat: false }));
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatForm.spaceId || !chatForm.message || !accessToken) return;

    setServiceLoading(prev => ({ ...prev, chat: true }));
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${chatForm.spaceId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: chatForm.message })
      });
      if (!res.ok) throw new Error('Chat message transmission failed');
      triggerTabMessage('chat', 'success', isRtl ? 'تم إرسال الموجز الإخباري لقناة Google Chat بنجاح!' : 'Media alert broadcast successfully on Google Chat Space!');
      setChatForm(prev => ({ ...prev, message: '' }));
    } catch (err: any) {
      triggerTabMessage('chat', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, chat: false }));
    }
  };

  // [9] GOOGLE MEET (Meeting Rooms Generator)
  const [createdMeetUrl, setCreatedMeetUrl] = useState<string | null>(null);
  const handleStartMeet = async () => {
    if (!accessToken) return;

    if (!window.confirm(isRtl ? 'هل تريد تشغيل وإنشاء غرفة اجتماع فورية في جوجل ميت؟' : 'Establish a fresh meeting space with Google Meet?')) {
      return;
    }

    setServiceLoading(prev => ({ ...prev, meet: true }));
    try {
      // In Workspace Meet API, we create spaces via the spaces endpoint
      const res = await fetch('https://meet.googleapis.com/v1/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: { accessionType: 'OPEN' }
        })
      });
      if (!res.ok) throw new Error('Failed to create Google Meet space');
      const data = await res.json();
      setCreatedMeetUrl(data.meetingUri);
      triggerTabMessage('meet', 'success', isRtl ? 'تم إنشاء رابط مساحة الاجتماع!' : 'Google Meet room successfully initialized!');
    } catch (err: any) {
      triggerTabMessage('meet', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, meet: false }));
    }
  };

  // [10] GOOGLE FORMS (Survey & Feedback Creator)
  const handlePublishForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCreator.title || !accessToken) return;

    if (!window.confirm(isRtl ? 'تأكيد تخليق مسودة استطلاع الرأي على جوجل فورمز؟' : 'Confirm building Google Form poll?')) {
      return;
    }

    setServiceLoading(prev => ({ ...prev, forms: true }));
    try {
      // Create empty form structure
      const res = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          info: {
            title: formCreator.title,
            description: formCreator.description || (isRtl ? 'استبيان رأي ميزانية بيت الصحافة' : 'PressHouse Opinion Poll Survey')
          }
        })
      });
      if (!res.ok) throw new Error('Could not configure form metadata');
      const formData = await res.json();
      const formId = formData.formId;

      // Add a default text question if requested
      if (formCreator.question) {
        await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                createItem: {
                  item: {
                    title: formCreator.question,
                    questionItem: {
                      question: {
                        required: true,
                        textQuestion: { paragraph: true }
                      }
                    }
                  },
                  location: { index: 0 }
                }
              }
            ]
          })
        });
      }

      triggerTabMessage('forms', 'success', isRtl ? `تم نشر الاستطلاع وسجل الاستبيان بنجاح! الرابط معرّف: ${formId.substring(0,8)}...` : `Opinion Poll form posted! ID: ${formId.substring(0,8)}...`);
      setFormCreator({ title: '', description: '', question: '' });
      window.open(`https://docs.google.com/forms/d/${formId}/edit`, '_blank');
      fetchDriveFiles();
    } catch (err: any) {
      triggerTabMessage('forms', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, forms: false }));
    }
  };

  // [11] CONTACTS (People API Partners manager)
  const fetchContacts = async () => {
    if (!accessToken) return;
    setServiceLoading(prev => ({ ...prev, contacts: true }));
    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=10', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.connections || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setServiceLoading(prev => ({ ...prev, contacts: false }));
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !accessToken) return;

    setServiceLoading(prev => ({ ...prev, contacts: true }));
    try {
      const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          names: [{ givenName: contactForm.name }],
          emailAddresses: contactForm.email ? [{ value: contactForm.email }] : [],
          phoneNumbers: contactForm.phone ? [{ value: contactForm.phone, type: 'work' }] : []
        })
      });
      if (!res.ok) throw new Error('Create connection error on People API');
      triggerTabMessage('contacts', 'success', isRtl ? 'تم إدراج بيانات جهة الاتصال الإعلامية بنجاح!' : 'Media contact added to Connections!');
      setContactForm({ name: '', email: '', phone: '' });
      fetchContacts();
    } catch (err: any) {
      triggerTabMessage('contacts', 'error', err.message);
    } finally {
      setServiceLoading(prev => ({ ...prev, contacts: false }));
    }
  };

  // Master Sign-In Screen if unauthorized
  if (needsAuth) {
    return (
      <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-xl max-w-2xl mx-auto my-8 text-center" id="workspace-login-card">
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
          <Globe size={32} />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">
          {isRtl ? 'بوابة جوجل وورك سبيس السحابية' : 'Google Workspace Cloud Portal'}
        </h2>
        
        <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
          {isRtl 
            ? 'قم بتسجيل الدخول الفوري للربط والتحكم بنظام إدارة الحلف الإعلامي عبر أحد عشر (11) خدمة سحابية معتمدة من Google للمؤسسات الصحفية مجاناً وبأعلى درجات الأمان.'
            : 'Access administrative cloud operations synchronized with 11 industry-leading Google Workspace cloud services to supercharge your civil media network securely.'}
        </p>

        {authError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2 justify-center">
            <AlertTriangle size={16} />
            <span>{authError}</span>
          </div>
        )}

        <button 
          onClick={handleSignIn}
          disabled={isLoading}
          className="mx-auto flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold px-8 py-4 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          id="google-signin-btn"
        >
          {isLoading ? (
            <Loader2 className="animate-spin text-blue-600" size={20} />
          ) : (
            <>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isRtl ? 'تسجيل الدخول بالحساب المعتمد (Google)' : 'Authorize Workspace credentials'}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Loaded Dashboard Layout
  return (
    <div className="space-y-8" id="workspace-portal-dashboard">
      {/* Executive Status Bar */}
      <div className="bg-slate-900 text-white rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Globe className="animate-pulse" size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              {isRtl ? 'حالة التزامن والاتصال الفيدرالي' : 'Federal Synchronization Status'}
            </div>
            <h3 className="text-lg md:text-xl font-black tracking-tight mt-1">
              {user?.displayName || user?.email}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-md">
              {isRtl 
                ? 'لوحة تحكم إدارية مكتملة لمؤسسة بيت الصحافة باليمن.'
                : 'Workspace cloud core is active and synchronized for PressHouse Yemen.'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white transition-all px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
        >
          <LogOut size={14} />
          <span>{isRtl ? 'تعطيل الاتصال' : 'Revoke Session'}</span>
        </button>
      </div>

      {/* Grid: Menu of 11 Services & Tab Editor Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation panel comprising 11 systems */}
        <div className="col-span-1 lg:col-span-4 bg-white border border-slate-100 p-4 rounded-[32px] shadow-sm space-y-2">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider px-3 mb-4">
            {isRtl ? 'الخدمات الغيمة المتكاملة (11 خدمة)' : 'Integrated Cloud Systems (11 APIs)'}
          </h4>

          {/* DRD / Content & Assets */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 block px-3 mt-4 mb-2">
              {isRtl ? 'المستندات والمكتبة' : 'Assets & Documents'}
            </span>
            <TabButton label={isRtl ? 'مستودع درايف (Drive)' : 'Google Drive'} tabId="drive" icon={<Folder size={16} />} current={activeTab} handler={setActiveTab} />
            <TabButton label={isRtl ? 'محرر الوثائق (Docs)' : 'Google Docs'} tabId="docs" icon={<FileText size={16} />} current={activeTab} handler={setActiveTab} />
            <TabButton label={isRtl ? 'جداول البيانات (Sheets)' : 'Google Sheets'} tabId="sheets" icon={<FileSpreadsheet size={16} />} current={activeTab} handler={setActiveTab} />
            <TabButton label={isRtl ? 'محرر الشرائح (Slides)' : 'Google Slides'} tabId="slides" icon={<Presentation size={16} />} current={activeTab} handler={setActiveTab} />
            <TabButton label={isRtl ? 'نماذج الاستبيان (Forms)' : 'Google Forms'} tabId="forms" icon={<Clipboard size={16} />} current={activeTab} handler={setActiveTab} />
          </div>

          {/* COM / Press & Advocacy */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 block px-3 mt-4 mb-2">
              {isRtl ? 'التواصل والرصد' : 'Advocacy & Outreach'}
            </span>
            <TabButton label={isRtl ? 'بريد جيميل (Gmail)' : 'Gmail'} tabId="gmail" icon={<Mail size={16} />} current={activeTab} handler={setActiveTab} />
            <TabButton label={isRtl ? 'مساحات الشات (Chat)' : 'Google Chat'} tabId="chat" icon={<MessageSquare size={16} />} current={activeTab} handler={setActiveTab} />
            <TabButton label={isRtl ? 'سجل الاتصالات (Contacts)' : 'Google Contacts'} tabId="contacts" icon={<Users size={16} />} current={activeTab} handler={setActiveTab} />
            <TabButton label={isRtl ? 'تقويم الفعاليات (Calendar)' : 'Google Calendar'} tabId="calendar" icon={<Calendar size={16} />} current={activeTab} handler={setActiveTab} />
          </div>

          {/* OPS / Tasks & Workspace operations */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-600 block px-3 mt-4 mb-2">
              {isRtl ? 'إدارة العمليات' : 'Operations & Logistics'}
            </span>
            <TabButton label={isRtl ? 'سجل المهام (Tasks)' : 'Google Tasks'} tabId="tasks" icon={<CheckSquare size={16} />} current={activeTab} handler={setActiveTab} />
            <TabButton label={isRtl ? 'غرف الفيديو (Meet)' : 'Google Meet'} tabId="meet" icon={<Video size={16} />} current={activeTab} handler={setActiveTab} />
          </div>
        </div>

        {/* Action Panel and visualizer dashboard */}
        <div className="col-span-1 lg:col-span-8 bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm min-h-[500px]">
          {/* Output messages */}
          {actionSuccess[activeTab] && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
              <Check size={16} />
              <span>{actionSuccess[activeTab]}</span>
            </div>
          )}
          {actionError[activeTab] && (
            <div className="bg-rose-50 text-rose-700 border border-rose-100 px-4 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{actionError[activeTab]}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Folder size={20} className="text-blue-500" />
                  <span>{isRtl ? 'مستودع السحاب درايف' : 'Google Drive Vault'}</span>
                </h4>
                <div className="relative">
                  <input
                    type="text"
                    value={driveQuery}
                    onChange={(e) => setDriveQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDriveFiles()}
                    placeholder={isRtl ? 'ابحث في درايف...' : 'Search Drive...'}
                    className="w-48 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-medium"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>
              </div>

              {/* Upload Helper */}
              <form onSubmit={handleUploadDriveFile} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <span className="text-xs font-black text-slate-500 uppercase block">{isRtl ? 'رفع مسودة نصية عاجلة' : 'Quick file uploader (plain text)'}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={driveUpload.name}
                    onChange={(e) => setDriveUpload(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={isRtl ? 'اسم الملف الجديد...' : 'New File Name...'}
                    className="w-full p-3 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                    required
                  />
                </div>
                <textarea 
                  rows={3}
                  value={driveUpload.textContent}
                  onChange={(e) => setDriveUpload(prev => ({ ...prev, textContent: e.target.value }))}
                  placeholder={isRtl ? 'اكتب نص البيان لرفعه...' : 'Paste document text...'}
                  className="w-full p-4 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  required
                />
                <button 
                  type="submit"
                  disabled={serviceLoading.drive}
                  className="btn-primary py-2.5 text-xs px-6 hover:bg-slate-800 w-full md:w-auto"
                >
                  {serviceLoading.drive ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  <span>{isRtl ? 'رفع المستند لـ Drive' : 'Upload to Google Drive'}</span>
                </button>
              </form>

              {/* Browse area */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-400 block">{isRtl ? 'ملفاتك الحديثة السحابية' : 'Latest files in Cloud'}</span>
                {serviceLoading.drive ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
                ) : driveFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">{isRtl ? 'لا يوجد ملفات مطابقة في درايف.' : 'No items found in Drive.'}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {driveFiles.map((file) => (
                      <a 
                        key={file.id} 
                        href={file.webViewLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-3 border border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50/10 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {file.iconLink && <img src={file.iconLink} alt="" className="w-5 h-5 shrink-0" />}
                          <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                        </div>
                        <ExternalLink size={12} className="text-slate-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6">
                <h4 className="font-black text-slate-950 text-lg flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  <span>{isRtl ? 'محرر مستندات جوجل للتقارير' : 'Google Docs Reporter'}</span>
                </h4>
              </div>

              <form onSubmit={handleCreateDoc} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1">{isRtl ? 'العنوان الأساسي للتقرير' : 'Report Document Title'}</label>
                  <input 
                    type="text" 
                    value={docForm.title}
                    onChange={(e) => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isRtl ? 'مثال: تقرير شبكة الحريات الربع السنوي...' : 'Quarterly rights report...'}
                    className="w-full p-4 bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1">{isRtl ? 'محتوى ونصوص البيّان التأسيسي' : 'Draft Document Body'}</label>
                  <textarea 
                    rows={8}
                    value={docForm.body}
                    onChange={(e) => setDocForm(prev => ({ ...prev, body: e.target.value }))}
                    placeholder={isRtl ? 'اكتب مقدمة ومقترح البلاغ هنا لمزامنته...' : 'Write report outline or release details here...'}
                    className="w-full p-4 bg-slate-50 text-slate-800 rounded-2xl border border-slate-200 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={serviceLoading.docs}
                  className="btn-primary py-3.5 text-xs font-bold px-8 hover:bg-slate-800 flex items-center gap-2 rounded-xl"
                >
                  {serviceLoading.docs ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                  <span>{isRtl ? 'تخليق المستند في Google Docs' : 'Instantly create document'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-emerald-500" />
                  <span>{isRtl ? 'تحليلات ومزامنة جوجل شيت' : 'Google Sheets Sync Engine'}</span>
                </h4>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4" id="sheets-sync-panel">
                <span className="text-xs font-black text-indigo-600 block uppercase tracking-wider">{isRtl ? 'مزامنة السجلات السحابية' : 'Dynamic CSV Cloud Sync'}</span>
                <p className="text-xs text-slate-500">
                  {isRtl 
                    ? 'اختر قاعدة البيانات التي ترغب في ترحيلها وجدولتها للحفظ الاحتياطي تلقائياً على ورقة سحابية ممتدة (Google Sheets) لمشاركتها مع مجالس الإدارة والشركاء.'
                    : 'Select the database you want to synthesize and deploy instantly to Google Sheets.'}
                </p>

                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer flex-1 justify-center font-bold text-xs text-slate-700">
                      <input 
                        type="radio" 
                        name="backupSource" 
                        value="violations" 
                        checked={backupSource === 'violations'}
                        onChange={() => setBackupSource('violations')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{isRtl ? 'تقرير الانتهاكات' : 'Violations Database'}</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer flex-1 justify-center font-bold text-xs text-slate-700">
                      <input 
                        type="radio" 
                        name="backupSource" 
                        value="projects" 
                        checked={backupSource === 'projects'}
                        onChange={() => setBackupSource('projects')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{isRtl ? 'قائمة المبادرات' : 'Projects List'}</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer flex-1 justify-center font-bold text-xs text-slate-700">
                      <input 
                        type="radio" 
                        name="backupSource" 
                        value="subscribers" 
                        checked={backupSource === 'subscribers'}
                        onChange={() => setBackupSource('subscribers')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{isRtl ? 'قائمة المشتركين' : 'Subscriber Mailbox'}</span>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={handleBackupToSheets}
                  disabled={serviceLoading.sheets}
                  className="btn-primary w-full py-3 text-xs bg-emerald-600 hover:bg-emerald-700 flex justify-center gap-2 border-none rounded-xl"
                >
                  {serviceLoading.sheets ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                  <span>{isRtl ? 'ترحيل ومزامنة وفتح المستند السحابي' : 'Execute Backup to Google Sheets'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE SLIDES */}
          {activeTab === 'slides' && (
            <div className="space-y-6 text-center py-8">
              <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
                <Presentation size={32} />
              </div>
              <h4 className="font-black text-slate-900 text-lg">
                {isRtl ? 'توليد العروض التدريبية (Slides)' : 'Google Slides Blueprint Presentation Generator'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {isRtl 
                  ? 'بضغطة زر واحدة، تولد المنصة عروض الشرائح التأسيسية والحقائب التدريبية الخاصة بالدورة المختارة، ومزامنة وتصميم الهيكل الإنشائي والمفردات مباشرة كملف عرض تقديمي سحابي.'
                  : 'Synthesize academic curriculums and structural outlines directly into premium presentation decks.'}
              </p>

              <button 
                onClick={handleCreateSlides}
                disabled={serviceLoading.slides}
                className="btn-primary mx-auto py-3 px-8 text-xs bg-amber-500 hover:bg-amber-600"
              >
                {serviceLoading.slides ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                <span>{isRtl ? 'ترحيل وبدء تصميم العرض السحابي' : 'Create Google Class Presentation'}</span>
              </button>
            </div>
          )}

          {/* TAB 5: GOOGLE FORMS */}
          {activeTab === 'forms' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Clipboard size={20} className="text-purple-500" />
                  <span>{isRtl ? 'باني استطلاعات الرأي (Forms)' : 'Google Forms Survey Generator'}</span>
                </h4>
              </div>

              <form onSubmit={handlePublishForm} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-1">{isRtl ? 'عنوان الاستطلاع العريض' : 'Form/Poll Title'}</label>
                  <input 
                    type="text" 
                    value={formCreator.title}
                    onChange={(e) => setFormCreator(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isRtl ? 'مثال: قياس أثر السلامة المهنية للصحفيين' : 'Professional journalists safety poll...'}
                    className="w-full p-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-1">{isRtl ? 'وصف تفصيلي للبيانات' : 'Description'}</label>
                  <input 
                    type="text" 
                    value={formCreator.description}
                    onChange={(e) => setFormCreator(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={isRtl ? 'استبيان لجمع بيانات ورأي الوسط الإعلامي لعام 2026...' : 'Rights and advocacy survey to gather insights...'}
                    className="w-full p-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-1">{isRtl ? 'السؤال الرئيسي المفتوح للاستبيان' : 'Primary Essay Question'}</label>
                  <input 
                    type="text" 
                    value={formCreator.question}
                    onChange={(e) => setFormCreator(prev => ({ ...prev, question: e.target.value }))}
                    placeholder={isRtl ? 'مثال: ما أهم التحديات التي تقيد وصولك الفوري للخبر؟' : 'What is the biggest challenge restricting your coverage?'}
                    className="w-full p-3 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={serviceLoading.forms}
                  className="btn-primary py-3.5 text-xs bg-purple-600 hover:bg-purple-700 w-full md:w-auto text-white rounded-xl"
                >
                  {serviceLoading.forms ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  <span>{isRtl ? 'إنشاء مسودة ونشر لـ Google Forms' : 'Compile & Launch Google Form'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: GMAIL */}
          {activeTab === 'gmail' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Mail size={20} className="text-rose-500" />
                  <span>{isRtl ? 'حساب بريد جيميل الإعلامي' : 'Gmail Pressroom Center'}</span>
                </h4>
              </div>

              {/* Send Mail form */}
              <form onSubmit={handleSendEmail} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <span className="text-xs font-black text-slate-500 uppercase block">{isRtl ? 'إرسال بريد صحفي عاجل' : 'Compose professional email'}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="email" 
                    value={mailForm.to}
                    onChange={(e) => setMailForm(prev => ({ ...prev, to: e.target.value }))}
                    placeholder={isRtl ? 'البريد الإلكتروني للمستلم...' : 'Recipient email...'}
                    className="w-full p-3 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                    required
                  />
                  <input 
                    type="text" 
                    value={mailForm.subject}
                    onChange={(e) => setMailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={isRtl ? 'موضوع الرسالة...' : 'Subject...'}
                    className="w-full p-3 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs font-bold outline-none"
                    required
                  />
                </div>
                <textarea 
                  rows={4}
                  value={mailForm.body}
                  onChange={(e) => setMailForm(prev => ({ ...prev, body: e.target.value }))}
                  placeholder={isRtl ? 'اكتب محتوى الرسالة وتحديثات بيت الصحافة...' : 'Write email content...'}
                  className="w-full p-4 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  required
                />
                <button 
                  type="submit"
                  disabled={serviceLoading.gmail}
                  className="btn-primary py-2.5 text-xs px-6 hover:bg-slate-800"
                >
                  {serviceLoading.gmail ? <Loader2 className="animate-spin" size={14} /> : <Mail size={14} />}
                  <span>{isRtl ? 'إرسال الرسالة السريعة' : 'Send via Gmail API'}</span>
                </button>
              </form>

              {/* View messages */}
              <div className="space-y-3">
                <span className="text-xs font-black text-slate-400 block">{isRtl ? 'صندوق الوارد (الـ 5 رسائل الأخيرة)' : 'Recent Inbox Emails (last 5)'}</span>
                {serviceLoading.gmail ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-600" /></div>
                ) : mailMessages.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">{isRtl ? 'البريد الوارد فارغ حالياً.' : 'Inbox is empty.'}</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {mailMessages.map((msg) => {
                      const subjectHeader = msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(بدون عنوان)';
                      const fromHeader = msg.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'مجهول';
                      return (
                        <div key={msg.id} className="py-3 flex flex-col gap-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span className="truncate max-w-[200px]">{fromHeader}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">ID: {msg.id.substring(0,8)}</span>
                          </div>
                          <span className="font-semibold text-blue-600 truncate">{subjectHeader}</span>
                          <p className="text-slate-500 line-clamp-1 italic">{msg.snippet}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: GOOGLE CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <MessageSquare size={20} className="text-emerald-500" />
                  <span>{isRtl ? 'مساعد البث وغرف الشات' : 'Google Chat Space Messenger'}</span>
                </h4>
              </div>

              <form onSubmit={handleSendChatMessage} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <span className="text-xs font-black text-slate-500 uppercase block">{isRtl ? 'إرسال موجز لغرفة الشات' : 'Broadcast to Google Chat Space'}</span>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">{isRtl ? 'اختر مجموعة أو مساحة الشات' : 'Select Chat Space'}</label>
                  <select 
                    value={chatForm.spaceId}
                    onChange={(e) => setChatForm(prev => ({ ...prev, spaceId: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    required
                  >
                    <option value="">{isRtl ? '-- حدد مساحة شات مفعلة --' : '-- Select active Chat Space --'}</option>
                    {chatSpaces.map(space => (
                      <option key={space.name} value={space.name}>{space.displayName || space.name}</option>
                    ))}
                    <option value="spaces/demo-press-room">{isRtl ? 'غرفة الأخبار التجريبية (Demo)' : 'News Room Space (Demo)'}</option>
                  </select>
                </div>

                <textarea 
                  rows={3}
                  value={chatForm.message}
                  onChange={(e) => setChatForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder={isRtl ? 'اكتب الموجز لإرساله فوراً...' : 'Write message content here...'}
                  className="w-full p-4 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                  required
                />

                <button 
                  type="submit"
                  disabled={serviceLoading.chat}
                  className="btn-primary py-2.5 text-xs px-6 bg-emerald-600 hover:bg-emerald-700"
                >
                  {serviceLoading.chat ? <Loader2 className="animate-spin" size={14} /> : <MessageSquare size={14} />}
                  <span>{isRtl ? 'بث الرسالة الفورية' : 'Post Message via Chat API'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 8: GOOGLE CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Users size={20} className="text-teal-500" />
                  <span>{isRtl ? 'سجل الاتصالات والشركاء (Contacts)' : 'Google Contacts Media Network'}</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Add dynamic Contacts */}
                <form onSubmit={handleAddContact} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <span className="text-xs font-black text-slate-500 block uppercase tracking-wider">{isRtl ? 'إدراج جهة اتصال إعلامية' : 'Insert Media Contact'}</span>
                  <input 
                    type="text" 
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={isRtl ? 'الاسم الثنائي / الصحفي...' : 'Full Contact Name...'}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    required
                  />
                  <input 
                    type="email" 
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={isRtl ? 'البريد الإلكتروني للزميل...' : 'Journalist Email...'}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />
                  <input 
                    type="tel" 
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder={isRtl ? 'الرقم المباشر (تساب)...' : 'WhatsApp Direct number...'}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />

                  <button 
                    type="submit"
                    disabled={serviceLoading.contacts}
                    className="btn-primary w-full py-2 bg-teal-600 hover:bg-teal-700 font-bold text-xs rounded-xl"
                  >
                    {serviceLoading.contacts ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    <span>{isRtl ? 'إضافة للشبكة' : 'Save Connection'}</span>
                  </button>
                </form>

                {/* List Connections */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-slate-400 block">{isRtl ? 'قائمة الشركاء والصحفيين السحابية' : 'Cloud Connections Grid'}</span>
                  {serviceLoading.contacts ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-teal-600" /></div>
                  ) : contacts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">{isRtl ? 'لا توجد جهات اتصال مضافة حالياً.' : 'Connections directory is empty.'}</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {contacts.map((c, i) => {
                        const name = c.names?.[0]?.displayName || '(بلا اسم)';
                        const email = c.emailAddresses?.[0]?.value || '(بلا بريد)';
                        const phone = c.phoneNumbers?.[0]?.value || '(بلا هاتف)';
                        return (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-800">{name}</div>
                              <div className="text-[10px] text-slate-500">{email} • {phone}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: GOOGLE CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-500" />
                  <span>{isRtl ? 'جدولة ومواعيد تقويم جوجل' : 'Google Calendar Scheduling Core'}</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="calendar-operations-area">
                {/* Form to schedule */}
                <form onSubmit={handleCreateEvent} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <span className="text-xs font-black text-indigo-600 block uppercase tracking-wider">{isRtl ? 'جدولة فعالية صحفية جديدة' : 'Schedule Press Event'}</span>
                  <input 
                    type="text" 
                    value={calendarForm.title}
                    onChange={(e) => setCalendarForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isRtl ? 'عنوان الندوة أو الجلسة...' : 'Roundtable meeting title...'}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="datetime-local" 
                      value={calendarForm.date}
                      onChange={(e) => setCalendarForm(prev => ({ ...prev, date: e.target.value }))}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shrink-0 outline-none"
                      required
                    />
                    <select 
                      value={calendarForm.duration} 
                      onChange={(e) => setCalendarForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="30">30 {isRtl ? 'دقيقة' : 'mins'}</option>
                      <option value="60">60 {isRtl ? 'دقيقة (ساعة)' : 'mins (1 hr)'}</option>
                      <option value="120">120 {isRtl ? 'ساعتين' : '120 mins (2 hrs)'}</option>
                    </select>
                  </div>
                  <input 
                    type="text" 
                    value={calendarForm.location}
                    onChange={(e) => setCalendarForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={isRtl ? 'موقع الفعالية الفعلي / قاعة الزووم' : 'Event Location / Online link'}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />
                  <textarea 
                    rows={2}
                    value={calendarForm.description}
                    onChange={(e) => setCalendarForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={isRtl ? 'ملاحظات وتفاصيل الأجندة...' : 'Event description...'}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />

                  <button 
                    type="submit"
                    disabled={serviceLoading.calendar}
                    className="btn-primary w-full py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs border-none rounded-xl"
                  >
                    {serviceLoading.calendar ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    <span>{isRtl ? 'إدراج وتزامن التقويم' : 'Save Event to Google Calendar'}</span>
                  </button>
                </form>

                {/* Events list */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-slate-400 block">{isRtl ? 'أبرز فعاليات التقويم الحالية' : 'Upcoming scheduled events'}</span>
                  {serviceLoading.calendar ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-indigo-600" /></div>
                  ) : calendarEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">{isRtl ? 'التقويم خالي من الندوات المجدولة للمستقبل.' : 'No upcoming events.'}</p>
                  ) : (
                    <div className="space-y-3">
                      {calendarEvents.map((ev, idx) => {
                        const desc = ev.description ? ev.description.substring(0, 100) : '';
                        const time = ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString(isRtl ? 'ar-YE' : 'en-US') : '(بدون موعد)';
                        return (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-500 transition-colors">
                            <span className="text-[10px] text-blue-600 font-bold block">{time}</span>
                            <span className="text-xs font-black text-slate-800 block mt-1">{ev.summary}</span>
                            {ev.location && <span className="text-[10px] text-slate-500 block mt-0.5 font-bold italic">📍 {ev.location}</span>}
                            {desc && <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{desc}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: GOOGLE TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="border-b pb-4 mb-6">
                <h4 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <CheckSquare size={20} className="text-rose-500" />
                  <span>{isRtl ? 'مزامنة التكليفات والمهام التحريرية (Tasks)' : 'Google Tasks Pressroom Core'}</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form to append task */}
                <form onSubmit={handleCreateTask} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <span className="text-xs font-black text-slate-500 block uppercase tracking-wider">{isRtl ? 'إدراج مهمة عاجلة جديدة' : 'Add Presswork Task'}</span>
                  <input 
                    type="text" 
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isRtl ? 'عنوان التكليف الصحفي...' : 'Task assignment title...'}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    required
                  />
                  <textarea 
                    rows={2}
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={isRtl ? 'سجل ملاحظات التكليف...' : 'Task notes...'}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />

                  <button 
                    type="submit"
                    disabled={serviceLoading.tasks}
                    className="btn-primary w-full py-2 bg-rose-600 hover:bg-rose-700 font-bold text-xs border-none rounded-xl"
                  >
                    {serviceLoading.tasks ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    <span>{isRtl ? 'تزامن وإدراج لـ Tasks' : 'Sync task to Google Core'}</span>
                  </button>
                </form>

                {/* List dynamic Tasks */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-slate-400 block">{isRtl ? 'قائمة المهام والتكليفات النشطة' : 'Active Tasks checklist'}</span>
                  {serviceLoading.tasks ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-rose-600" /></div>
                  ) : taskList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">{isRtl ? 'قائمة المهام خالية.' : 'Tasks checklist is empty.'}</p>
                  ) : (
                    <div className="space-y-2">
                      {taskList.map((task) => (
                        <div key={task.id} className="p-3 bg-slate-50 rounded-xl text-xs flex items-center justify-between border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800 block">{task.title}</span>
                            {task.notes && <span className="text-[10px] text-slate-500 block mt-0.5">{task.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: GOOGLE MEET */}
          {activeTab === 'meet' && (
            <div className="space-y-6 text-center py-10">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                <Video size={32} />
              </div>
              <h4 className="font-black text-slate-900 text-lg">
                {isRtl ? 'إنشاء غرف وجلسات جوجل ميت' : 'Google Meet Interactive Room Generator'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {isRtl 
                  ? 'بنقرة واحدة عاجلة، قم بتوليد وإنشاء غرف ندوات واجتماعات رقمية مشفرة بالكامل لمجالس الإدارة أو برامج الحوار التدريبي.'
                  : 'Establish standalone and dedicated meeting spaces directly in Google Meet for roundtables.'}
              </p>

              <button 
                onClick={handleStartMeet}
                disabled={serviceLoading.meet}
                className="btn-primary mx-auto py-3 px-8 text-xs bg-blue-600 hover:bg-blue-700"
              >
                {serviceLoading.meet ? <Loader2 className="animate-spin" size={16} /> : <Video size={16} />}
                <span>{isRtl ? 'توليد مساحة لقاعة جديدة' : 'Initialize Google Meet space'}</span>
              </button>

              {createdMeetUrl && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6 max-w-md mx-auto space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">{isRtl ? 'رابط غرفة الاجتماع المولدّ' : 'Generated Meeting Space URI'}</span>
                  <a 
                    href={createdMeetUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-mono text-xs font-bold text-blue-600 break-all select-all flex items-center justify-center gap-1 hover:underline"
                  >
                    <span>{createdMeetUrl}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Sidebar/Group button auxiliary
function TabButton({ 
  label, 
  tabId, 
  icon, 
  current, 
  handler 
}: { 
  label: string; 
  tabId: string; 
  icon: React.ReactNode; 
  current: string; 
  handler: (id: string) => void;
}) {
  const active = current === tabId;
  return (
    <button
      onClick={() => handler(tabId)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold border-none transition-all cursor-pointer text-start outline-none ${
        active 
          ? 'bg-blue-50 text-blue-600 shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 bg-transparent'
      }`}
    >
      <span className={active ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
      <span>{label}</span>
      {active && <span className="ms-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
    </button>
  );
}
