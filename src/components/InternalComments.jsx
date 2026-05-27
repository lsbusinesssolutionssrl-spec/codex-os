import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Paperclip, AtSign, Edit2, Trash2, Reply, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'ora';
  if (diff < 3600) return `${Math.floor(diff/60)}m fa`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h fa`;
  return new Date(date).toLocaleDateString('it-IT');
}

function Avatar({ name, email }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : (email||'?')[0].toUpperCase();
  const colors = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-red-500','bg-indigo-500'];
  const color = colors[(email||'').charCodeAt(0) % colors.length];
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

function CommentItem({ comment, currentUser, users, onDelete, onReply, depth = 0 }) {
  const isOwn = comment.author_email === currentUser?.email;
  const [confirming, setConfirming] = useState(false);

  const renderContent = (content) => {
    return content.replace(/@(\w+[\w.]*)/g, '<span class="text-blue-600 font-medium">@$1</span>');
  };

  return (
    <div className={`flex gap-2.5 ${depth > 0 ? 'ml-8 mt-2' : ''}`}>
      <Avatar name={comment.author_name} email={comment.author_email} />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-800">{comment.author_name || comment.author_email}</span>
            <span className="text-xs text-gray-400">{timeAgo(comment.created_date)}</span>
            {comment.is_edited && <span className="text-xs text-gray-400 italic">modificato</span>}
          </div>
          <p
            className="text-sm text-gray-700 whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: renderContent(comment.content) }}
          />
          {comment.attachments?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {comment.attachments.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline flex items-center gap-1">
                  <Paperclip className="w-3 h-3" /> Allegato {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          {depth === 0 && (
            <button onClick={() => onReply(comment)} className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
              <Reply className="w-3 h-3" /> Rispondi
            </button>
          )}
          {isOwn && !confirming && (
            <button onClick={() => setConfirming(true)} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
              <Trash2 className="w-3 h-3" /> Elimina
            </button>
          )}
          {confirming && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Confermi?</span>
              <button onClick={() => { onDelete(comment.id); setConfirming(false); }} className="text-xs text-red-600 font-medium">Sì</button>
              <button onClick={() => setConfirming(false)} className="text-xs text-gray-500">No</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InternalComments({ entityType, entityId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const all = await base44.entities.Comment.filter({ entity_type: entityType, entity_id: entityId });
      setComments(all.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      setLoading(false);
    };
    load();
  }, [entityType, entityId]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    const mentions = [...text.matchAll(/@([\w.]+)/g)].map(m => m[1]);
    const created = await base44.entities.Comment.create({
      entity_type: entityType,
      entity_id: entityId,
      content: text.trim(),
      author_email: currentUser?.email,
      author_name: currentUser?.full_name,
      mentions,
      attachments: pendingAttachments,
      parent_id: replyTo?.id || null,
      is_internal: true,
    });
    setComments(prev => [...prev, created]);
    setText('');
    setPendingAttachments([]);
    setReplyTo(null);
    setSubmitting(false);
  };

  const deleteComment = async (id) => {
    await base44.entities.Comment.delete(id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPendingAttachments(prev => [...prev, file_url]);
    setUploadingFile(false);
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const replies = (parentId) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-blue-600" />
        Commenti Interni
        {comments.length > 0 && <span className="text-xs text-gray-400 font-normal">({comments.length})</span>}
        <span className="ml-auto text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
          🔒 Solo team interno
        </span>
      </h3>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-4">Caricamento...</p>
      ) : (
        <div className="space-y-3 mb-4">
          {topLevel.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Nessun commento. Inizia la conversazione...</p>
          )}
          {topLevel.map(c => (
            <div key={c.id}>
              <CommentItem
                comment={c}
                currentUser={currentUser}
                onDelete={deleteComment}
                onReply={setReplyTo}
                depth={0}
              />
              {replies(c.id).map(r => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  currentUser={currentUser}
                  onDelete={deleteComment}
                  onReply={() => {}}
                  depth={1}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {replyTo && (
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b border-blue-100">
            <span className="text-xs text-blue-700 font-medium">
              Risposta a {replyTo.author_name || replyTo.author_email}
            </span>
            <button onClick={() => setReplyTo(null)}><X className="w-3.5 h-3.5 text-blue-500" /></button>
          </div>
        )}
        {pendingAttachments.length > 0 && (
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-1.5">
            {pendingAttachments.map((url, i) => (
              <div key={i} className="flex items-center gap-1 text-xs bg-white border border-gray-200 rounded px-2 py-1">
                <Paperclip className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600">File {i+1}</span>
                <button onClick={() => setPendingAttachments(prev => prev.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 p-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder="Aggiungi un commento interno... Usa @nome per menzionare"
            rows={2}
            className="flex-1 text-sm px-2 py-1.5 resize-none focus:outline-none bg-transparent"
          />
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingFile}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title="Allega file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} />
            <button
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="p-1.5 rounded-lg text-white disabled:opacity-40 transition-colors"
              style={{ backgroundColor: '#1147FF' }}
              title="Invia (Ctrl+Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 px-3 pb-2">Ctrl+Enter per inviare · @nome per menzionare</p>
      </div>
    </div>
  );
}