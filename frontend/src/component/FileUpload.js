import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { UploadCloud, FileCheck, Loader2, FileText, Globe, AlertTriangle, Edit3 } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';

function RobotModel(props) {
  const { scene } = useGLTF('/models/robot.glb');
  const refLeft = useRef();
  const refRight = useRef();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (refLeft.current) {
      refLeft.current.position.y = Math.sin(time * 2) * 0.2 - 2.5;
      refLeft.current.rotation.y = Math.sin(time) * 0.4;
    }
    if (refRight.current) {
      refRight.current.position.y = Math.sin(time * 2) * 0.2 - 2.5;
      refRight.current.rotation.y = Math.sin(time) * 0.4;
    }
  });

  return (
    <>
      <primitive
        ref={refLeft}
        object={scene.clone()}
        scale={3.5}
        position={[-7, -0.205, 0]}
        {...props}
      />
      <primitive
        ref={refRight}
        object={scene.clone()}
        scale={3.5}
        position={[7, -0.205, 0]}
        {...props}
      />
    </>
  );
}

function FileUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [inputMode, setInputMode] = useState('file');
  const [inputText, setInputText] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
      setText('');
      setTranslation('');
    }
  };

  const handleUpload = async () => {
    if (inputMode === 'file') {
      if (!file) {
        setMessage('⚠️ Please select a file first!');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      setLoading(true);
      try {
        const response = await axios.post('http://127.0.0.1:5000/upload', formData);
        setMessage('✅ File successfully translated!');
        setText(response.data.text);
        setTranslation(response.data.translation);
      } catch (error) {
        setMessage('❌ Upload failed. Try again.');
      }
      setLoading(false);
    } else {
      if (!inputText.trim()) {
        setMessage('⚠️ Please enter some text first!');
        return;
      }
      setLoading(true);
      try {
        const response = await axios.post('http://127.0.0.1:5000/translate', { text: inputText });
        setMessage('✅ Text successfully translated!');
        setText(inputText);
        setTranslation(response.data.translation);
      } catch (error) {
        setMessage('❌ Translation failed. Try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-100 px-4 py-8 flex items-center justify-center">
      {/* Background 3D Scene */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[0, 10, 5]} intensity={0.8} />
          <RobotModel />
          <Environment preset="sunset" />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* Foreground UI */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/40 backdrop-blur-md shadow-xl rounded-3xl p-10 w-full max-w-3xl border border-white/30 z-10 relative"
      >
        <motion.h2 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
          AnuvaadAI
        </motion.h2>

        <div className="text-center text-gray-600 italic mb-4">
          Ancient wisdom meets modern intelligence
        </div>

        <div className="flex justify-center mb-6 gap-4">
          <button onClick={() => setInputMode("file")} className={`px-4 py-2 rounded-xl font-medium ${inputMode === "file" ? "bg-indigo-500 text-white" : "bg-indigo-100 text-indigo-600"}`}>Upload File</button>
          <button onClick={() => setInputMode("text")} className={`px-4 py-2 rounded-xl font-medium ${inputMode === "text" ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-600"}`}>Enter Text</button>
        </div>

        {inputMode === "file" && (
          <div className={`mb-6 p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center ${dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"}`}
            onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
            }}
          >
            <UploadCloud className="w-16 h-16 text-indigo-500 mb-4" />
            <p className="text-gray-600 text-center">
              Drag & drop your file here, or <label className="text-indigo-500 cursor-pointer">browse<input type="file" onChange={handleFileChange} className="hidden" /></label>
            </p>
            {file && <div className="mt-3 flex items-center gap-2 text-indigo-600 font-medium"><FileCheck className="w-5 h-5" />{file.name}</div>}
          </div>
        )}

        {inputMode === "text" && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xl font-semibold text-purple-600 mb-3">
              <Edit3 className="w-5 h-5" />
              <h3>Enter Sanskrit Text</h3>
            </div>
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full p-4 rounded-xl bg-white/70 border border-purple-200 focus:ring-2 focus:ring-purple-400 min-h-[150px]" placeholder="Type or paste Sanskrit text here..." />
          </div>
        )}

        <div className="flex justify-center mb-8">
          <motion.button
            onClick={handleUpload}
            disabled={loading}
            className={`px-6 py-3 rounded-xl shadow-md font-medium flex items-center gap-2 ${loading ? "bg-indigo-400" : "bg-indigo-500 hover:bg-indigo-600"} text-white`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><UploadCloud className="w-5 h-5" /> Translate</>}
          </motion.button>
        </div>

        {message && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex justify-center gap-2 font-medium mb-6 py-3 px-4 rounded-lg ${message.includes("✅") ? "bg-green-50 text-green-600" : message.includes("⚠️") ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"}`}
          >
            <AlertTriangle className="w-5 h-5" /> {message}
          </motion.div>
        )}

        {(text || translation) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {text && (
              <div>
                <div className="flex items-center gap-2 text-xl font-semibold text-indigo-600 mb-3">
                  <FileText className="w-5 h-5" /> Sanskrit Text
                </div>
                <div className="bg-white/70 p-4 rounded-xl shadow-sm border border-indigo-100 overflow-auto">
                  <pre className="whitespace-pre-wrap break-words text-gray-800">{text}</pre>
                </div>
              </div>
            )}
            {translation && (
              <div>
                <div className="flex items-center gap-2 text-xl font-semibold text-purple-600 mb-3">
                  <Globe className="w-5 h-5" /> English Translation
                </div>
                <div className="bg-white/70 p-4 rounded-xl shadow-sm border border-purple-100 overflow-auto">
                  <pre className="text-justify whitespace-pre-wrap break-words text-gray-700">{translation}</pre>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default FileUpload;
