export interface AlumniProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  graduationYear: number;
  verified: boolean;
  bio: string;
  contact: {
    phone: string;
    linkedin: string;
  };
  careerHistory: CareerEntry[];
  jobPostings: JobPosting[];
}

export interface CareerEntry {
  id: string;
  company: string;
  role: string;
  startYear: number;
  endYear: number | null;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  company: string;
  postedBy: string;
  postedDate: string;
}

export interface Query {
  id: string;
  studentId: string;
  studentName: string;
  alumniId: string;
  alumniName: string;
  status: 'pending' | 'answered';
  date: string;
  messages: Message[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export const mockAlumni: AlumniProfile[] = [
  {
    id: 'a1',
    name: 'Sarah Johnson',
    email: 'sarah.j@alumni.edu',
    department: 'Computer Science',
    graduationYear: 2018,
    verified: true,
    bio: 'Senior Software Engineer at Google with 6 years of experience in cloud computing and distributed systems.',
    contact: {
      phone: '+1-555-0101',
      linkedin: 'linkedin.com/in/sarahjohnson'
    },
    careerHistory: [
      { id: 'c1', company: 'Google', role: 'Senior Software Engineer', startYear: 2020, endYear: null },
      { id: 'c2', company: 'Microsoft', role: 'Software Engineer', startYear: 2018, endYear: 2020 }
    ],
    jobPostings: [
      {
        id: 'j1',
        title: 'Software Engineering Intern',
        description: 'Join our team for a summer internship working on cloud infrastructure.',
        company: 'Google',
        postedBy: 'a1',
        postedDate: '2026-03-10'
      }
    ]
  },
  {
    id: 'a2',
    name: 'Michael Chen',
    email: 'michael.c@alumni.edu',
    department: 'Electrical Engineering',
    graduationYear: 2019,
    verified: true,
    bio: 'Hardware Engineer at Tesla, specializing in battery management systems.',
    contact: {
      phone: '+1-555-0102',
      linkedin: 'linkedin.com/in/michaelchen'
    },
    careerHistory: [
      { id: 'c3', company: 'Tesla', role: 'Hardware Engineer', startYear: 2019, endYear: null }
    ],
    jobPostings: []
  },
  {
    id: 'a3',
    name: 'Emily Rodriguez',
    email: 'emily.r@alumni.edu',
    department: 'Computer Science',
    graduationYear: 2020,
    verified: true,
    bio: 'Full Stack Developer at Meta, passionate about building scalable web applications.',
    contact: {
      phone: '+1-555-0103',
      linkedin: 'linkedin.com/in/emilyrodriguez'
    },
    careerHistory: [
      { id: 'c4', company: 'Meta', role: 'Full Stack Developer', startYear: 2020, endYear: null }
    ],
    jobPostings: [
      {
        id: 'j2',
        title: 'Frontend Developer Position',
        description: 'Looking for passionate frontend developers to join our React team.',
        company: 'Meta',
        postedBy: 'a3',
        postedDate: '2026-03-15'
      }
    ]
  },
  {
    id: 'a4',
    name: 'David Park',
    email: 'david.p@alumni.edu',
    department: 'Mechanical Engineering',
    graduationYear: 2017,
    verified: false,
    bio: 'Mechanical Design Engineer specializing in automotive systems.',
    contact: {
      phone: '+1-555-0104',
      linkedin: 'linkedin.com/in/davidpark'
    },
    careerHistory: [],
    jobPostings: []
  }
];

export const mockQueries: Query[] = [
  {
    id: 'q1',
    studentId: 's1',
    studentName: 'John Student',
    alumniId: 'a1',
    alumniName: 'Sarah Johnson',
    status: 'answered',
    date: '2026-03-15',
    messages: [
      {
        id: 'm1',
        senderId: 's1',
        senderName: 'John Student',
        text: 'Hi Sarah! I\'m interested in learning more about cloud computing. What skills should I focus on?',
        timestamp: '2026-03-15T10:30:00'
      },
      {
        id: 'm2',
        senderId: 'a1',
        senderName: 'Sarah Johnson',
        text: 'Great question! I\'d recommend focusing on Docker, Kubernetes, and getting comfortable with at least one major cloud platform like AWS or GCP.',
        timestamp: '2026-03-15T14:20:00'
      }
    ]
  },
  {
    id: 'q2',
    studentId: 's1',
    studentName: 'John Student',
    alumniId: 'a3',
    alumniName: 'Emily Rodriguez',
    status: 'pending',
    date: '2026-03-17',
    messages: [
      {
        id: 'm3',
        senderId: 's1',
        senderName: 'John Student',
        text: 'Hello Emily! I saw you work at Meta. Could you share your experience with the interview process?',
        timestamp: '2026-03-17T09:15:00'
      }
    ]
  },
  {
    id: 'q3',
    studentId: 's2',
    studentName: 'Alice Brown',
    alumniId: 'a1',
    alumniName: 'Sarah Johnson',
    status: 'pending',
    date: '2026-03-16',
    messages: [
      {
        id: 'm4',
        senderId: 's2',
        senderName: 'Alice Brown',
        text: 'Hi! I\'m preparing for technical interviews. Any advice?',
        timestamp: '2026-03-16T16:45:00'
      }
    ]
  }
];
