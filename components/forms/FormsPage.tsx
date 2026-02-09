import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Role } from '../../types';
import ChapterReportForm from './ChapterReportForm';
import EventReportForm from './EventReportForm';

const FormsPage: React.FC = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const isChapterPresident = user.role === Role.CHAPTER_PRESIDENT;
  const formTitle = isChapterPresident ? 'Chapter President Monthly Input Form' : `${user.role} Event Data Form`;
  const formDescription = isChapterPresident 
    ? "As a Chapter President, please fill out your chapter's monthly performance report below."
    : `As a ${user.role}, please use this form to submit data for your periodic events.`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{formTitle}</h1>
        <p className="text-gray-600 mt-1">{formDescription}</p>
      </div>
      <div className="max-w-4xl mx-auto">
        {isChapterPresident ? (
          <ChapterReportForm />
        ) : (
          <EventReportForm />
        )}
      </div>
    </div>
  );
};

export default FormsPage;