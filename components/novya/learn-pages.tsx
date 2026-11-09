"use client";
import api from "@/lib/axios";
import {
  date,
  errorMessage,
  label,
  useSales,
  useSalesMutation,
  type Entity,
} from "@/lib/sales";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  FileText,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Back,
  Badge,
  Button,
  Card,
  DataState,
  DetailRows,
  Empty,
  Field,
  FormModal,
  Metric,
  Metrics,
  Modal,
  PageTitle,
  Progress,
  SearchBox,
  Table,
  Tabs,
} from "./ui";
function useLearn<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: ["learn", path],
    queryFn: async () => (await api.get(`/learn${path}`)).data.data as T,
    enabled,
  });
}
export function LearnPage({
  section = "",
  id,
  mode,
}: {
  section?: string;
  id?: string;
  mode?: string;
}) {
  const courses = useLearn<Entity[]>("/courses"),
    courseDetail = useLearn<Entity>(
      `/courses/${id}`,
      section === "courses" && !!id,
    ),
    assignments = useLearn<Entity[]>("/assignments"),
    certificates = useLearn<Entity[]>("/certificates"),
    knowledge = useSales<Entity[]>("/knowledge"),
    requests = useSales<Entity[]>("/requests"),
    q = useQueryClient(),
    m = useSalesMutation(),
    router = useRouter();
  const [term, setTerm] = useState(""),
    [tab, setTab] = useState("All"),
    [lesson, setLesson] = useState(0),
    [question, setQuestion] = useState(0),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [result, setResult] = useState<{
      score: number;
      passed: boolean;
      retryAvailable?: boolean;
    }>(),
    [busy, setBusy] = useState(false),
    [request, setRequest] = useState(false),
    [cert, setCert] = useState<Entity>();
  const course = courseDetail.data || courses.data?.find((c) => c._id === id),
    assignment = assignments.data?.find((a) => a.course_id?._id === id),
    article = knowledge.data?.find((a) => a._id === id),
    pending = assignments.data?.filter((a) => a.state !== "completed") || [],
    completed = assignments.data?.filter((a) => a.state === "completed") || [],
    pct = assignments.data?.length
      ? Math.round((completed.length / assignments.data.length) * 100)
      : 0;
  async function learnMutation(path: string, body: unknown) {
    setBusy(true);
    try {
      const r = await api.post(`/learn${path}`, body);
      await q.invalidateQueries({ queryKey: ["learn"] });
      return r.data.data as Entity;
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function start() {
    if (!course) return;
    try {
      if (!assignment)
        await learnMutation("/assignments", { course_id: course._id });
      router.push(`/learn/courses/${course._id}/player`);
    } catch {}
  }
  const courseCards = (rows: Entity[]) => (
    <div className="nv-course-grid">
      {rows.map((c) => {
        const a = assignments.data?.find((a) => a.course_id?._id === c._id),
          progress = c.lessons?.length
            ? ((a?.completedLessons?.length || 0) / c.lessons.length) * 100
            : 0;
        return (
          <Card key={c._id}>
            <Link href={`/learn/courses/${c._id}`}>
              <div className="nv-course-art">
                <Play size={30} />
              </div>
              <Badge>
                {a?.required ? "Required" : a?.state || "Available"}
              </Badge>
              <h3 style={{ fontSize: 14, margin: "15px 0 7px" }}>{c.title}</h3>
              <p className="nv-caption">
                {c.lessons?.length || 0} lessons · Version {c.version}
              </p>
              <Progress value={progress} tone="green" />
              <div className="nv-kpi-note">
                <span>{Math.round(progress)}% complete</span>
                <span>Open course →</span>
              </div>
            </Link>
          </Card>
        );
      })}
    </div>
  );
  const knowledgeList = (
    <Card title="Verified commercial guidance">
      <Table headers={["Article", "Category", "Version", "Published", ""]}>
        {knowledge.data
          ?.filter((a) =>
            `${a.title} ${a.category}`
              .toLowerCase()
              .includes(term.toLowerCase()),
          )
          .map((a) => (
            <tr key={a._id}>
              <td>
                <Link
                  href={`/learn/${section === "help" ? "help/articles" : "knowledge"}/${a._id}`}
                >
                  <strong>{a.title}</strong>
                  <small>{a.summary}</small>
                </Link>
              </td>
              <td>{label(a.category)}</td>
              <td>v{a.version}</td>
              <td>{date(a.publishedAt)}</td>
              <td>
                <Badge>Verified</Badge>
              </td>
            </tr>
          ))}
      </Table>
      {!knowledge.data?.length && (
        <Empty
          title="Verified guidance will appear here"
          description="Your content owners publish role guidance and commercial policies."
        />
      )}
    </Card>
  );
  if (
    section === "courses" &&
    id &&
    (courseDetail.isPending || courseDetail.error)
  )
    return (
      <DataState
        pending={courseDetail.isPending}
        error={courseDetail.error}
        retry={() => courseDetail.refetch()}
      >
        <></>
      </DataState>
    );
  if (course)
    return (
      <>
        <Back href="/learn/courses">Back to Courses</Back>
        <PageTitle
          title={
            mode === "quiz"
              ? "Final knowledge check"
              : mode === "complete"
                ? "Course completed"
                : course.title || "Course"
          }
          description={
            course.description ||
            "Build practical knowledge for your commercial work."
          }
        />
        {mode === "complete" ? (
          <Card>
            <div className="nv-completion">
              <div className="nv-success-icon">
                <Check size={30} />
              </div>
              <h2>
                {assignment?.state === "completed"
                  ? "Course completed"
                  : "Completion is still pending"}
              </h2>
              <p>{course.title}</p>
              <Metrics>
                <Metric label="Status" value={label(assignment?.state)} />
                <Metric
                  label="Completed"
                  value={date(assignment?.completedAt)}
                />
                <Metric label="Course version" value={`v${course.version}`} />
              </Metrics>
              <div className="nv-suggestions">
                <Button href="/learn/progress">View My Progress</Button>
                <Button href="/learn/courses">Continue learning</Button>
              </div>
            </div>
          </Card>
        ) : mode === "quiz" ? (
          <div className="nv-grid">
            <Card
              title={`Question ${question + 1} of ${course.quiz?.length || 0}`}
              description={`Pass mark ${course.passPercent || 80}%`}
            >
              <Progress
                value={
                  course.quiz?.length
                    ? ((question + 1) / course.quiz.length) * 100
                    : 0
                }
              />
              {course.quiz?.[question] ? (
                <>
                  <h2 style={{ fontSize: 19, margin: "30px 0" }}>
                    {course.quiz[question].prompt}
                  </h2>
                  {course.quiz[question].options.map((option, i) => (
                    <label
                      className="nv-list-row"
                      style={{
                        border: "1px solid #35435a",
                        borderRadius: 8,
                        padding: 15,
                        marginBottom: 10,
                        background:
                          answers[course.quiz?.[question]?.key || ""] === i
                            ? "#293b5a"
                            : "transparent",
                      }}
                      key={i}
                    >
                      <input
                        type="radio"
                        name="answer"
                        checked={
                          answers[course.quiz?.[question]?.key || ""] === i
                        }
                        onChange={() =>
                          setAnswers({
                            ...answers,
                            [course.quiz?.[question]?.key || ""]: i,
                          })
                        }
                      />
                      <div>{option}</div>
                    </label>
                  ))}
                  <div className="nv-form-actions">
                    <Button
                      disabled={!question}
                      onClick={() => setQuestion(question - 1)}
                    >
                      Previous
                    </Button>
                    {question < course.quiz.length - 1 ? (
                      <Button
                        primary
                        disabled={
                          answers[course.quiz[question].key] === undefined
                        }
                        onClick={() => setQuestion(question + 1)}
                      >
                        Next question
                      </Button>
                    ) : (
                      <Button
                        primary
                        disabled={
                          busy ||
                          Object.keys(answers).length !== course.quiz.length ||
                          !assignment
                        }
                        onClick={async () => {
                          try {
                            const r = await learnMutation(
                              `/assignments/${assignment?._id}/assessment`,
                              { operationId: crypto.randomUUID(), answers },
                            );
                            const value = r as unknown as {
                              score: number;
                              passed: boolean;
                              retryAvailable?: boolean;
                            };
                            setResult(value);
                          } catch {}
                        }}
                      >
                        Submit assessment
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <Empty title="This course has no assessment" />
              )}
            </Card>
            <Card title="Assessment details">
              <DetailRows
                rows={[
                  ["Course", course.title],
                  ["Version", course.version],
                  ["Questions", course.quiz?.length || 0],
                  ["Attempts used", assignment?.attempts || 0],
                  ["Maximum attempts", course.maxAttempts || 3],
                ]}
              />
              <p className="nv-caption">
                Your answers remain private. Required completion status is
                visible only where policy permits.
              </p>
            </Card>
          </div>
        ) : mode === "player" ? (
          <div className="nv-grid">
            <Card title={course.lessons?.[lesson]?.title || "Lesson"}>
              <div className="nv-course-art" style={{ height: 190 }}>
                <BookOpen size={48} />
              </div>
              <article className="nv-article">
                {course.lessons?.[lesson]?.content}
              </article>
              <div className="nv-form-actions">
                <Button
                  disabled={lesson === 0}
                  onClick={() => setLesson(lesson - 1)}
                >
                  Previous lesson
                </Button>
                <Button
                  primary
                  disabled={busy || !assignment}
                  onClick={async () => {
                    try {
                      const r = await learnMutation(
                        `/assignments/${assignment?._id}/checkpoint`,
                        { lessonKey: course.lessons?.[lesson]?.key },
                      );
                      if (lesson < (course.lessons?.length || 0) - 1)
                        setLesson(lesson + 1);
                      else
                        router.push(
                          `/learn/courses/${course._id}/${r.state === "completed" ? "complete" : "quiz"}`,
                        );
                    } catch {}
                  }}
                >
                  {lesson === (course.lessons?.length || 0) - 1
                    ? "Finish lessons"
                    : "Complete & continue"}
                  <ArrowRight size={13} />
                </Button>
              </div>
              {!assignment && <Button onClick={start}>Start enrollment</Button>}
            </Card>
            <Card title="Course modules">
              {course.lessons?.map((l, i) => (
                <button
                  className="nv-list-row"
                  style={{ width: "100%", textAlign: "left" }}
                  key={l.key}
                  disabled={
                    i > 0 &&
                    !assignment?.completedLessons?.includes(
                      course.lessons?.[i - 1]?.key || "",
                    )
                  }
                  onClick={() => setLesson(i)}
                >
                  <span>
                    {assignment?.completedLessons?.includes(l.key) ? (
                      <Check size={13} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <div>
                    <strong>{l.title}</strong>
                    <small>
                      {i === lesson ? "Current lesson" : "Course content"}
                    </small>
                  </div>
                </button>
              ))}
            </Card>
          </div>
        ) : (
          <div className="nv-grid">
            <Card>
              <div className="nv-course-art" style={{ height: 240 }}>
                <Play size={45} />
              </div>
              <h2 style={{ fontSize: 22 }}>{course.title}</h2>
              <p className="nv-article">{course.description}</p>
              <h3 style={{ fontSize: 14, marginTop: 25 }}>Course modules</h3>
              {course.lessons?.map((l, i) => (
                <div className="nv-list-row" key={l.key}>
                  <span className="nv-caption">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{l.title}</strong>
                  </div>
                  <Badge>
                    {assignment?.completedLessons?.includes(l.key)
                      ? "Completed"
                      : "Not started"}
                  </Badge>
                </div>
              ))}
            </Card>
            <div className="nv-stack">
              <Card title="Your assignment">
                <Badge>
                  {assignment?.required
                    ? "Required"
                    : assignment?.state || "Available"}
                </Badge>
                <div className="nv-goal">
                  <strong>
                    {course.lessons?.length
                      ? Math.round(
                          ((assignment?.completedLessons?.length || 0) /
                            course.lessons.length) *
                            100,
                        )
                      : 0}
                    %
                  </strong>
                  <Progress
                    value={
                      course.lessons?.length
                        ? ((assignment?.completedLessons?.length || 0) /
                            course.lessons.length) *
                          100
                        : 0
                    }
                    tone="green"
                  />
                </div>
                <DetailRows
                  rows={[
                    ["Due date", date(assignment?.dueAt)],
                    ["Version", `v${course.version}`],
                    ["Lessons", course.lessons?.length || 0],
                    [
                      "Assessment",
                      course.quiz?.length
                        ? `${course.quiz.length} questions`
                        : "No assessment",
                    ],
                  ]}
                />
                <Button primary disabled={busy} onClick={start}>
                  <Play size={13} />
                  {assignment ? "Resume course" : "Start course"}
                </Button>
              </Card>
              <Card title="Ask Kora">
                <p className="nv-caption">
                  Get help understanding course concepts from your authorized
                  context.
                </p>
                <Button
                  href={`/assistant?prompt=${encodeURIComponent(`Help explain the course ${course.title}.`)}`}
                >
                  <Sparkles size={13} />
                  Open Assistant
                </Button>
              </Card>
            </div>
          </div>
        )}
        <Modal
          open={!!result}
          onClose={() => setResult(undefined)}
          title={result?.passed ? "Assessment passed" : "Let's try that again"}
        >
          <div className="nv-completion">
            <div className="nv-success-icon">
              <Award size={30} />
            </div>
            <h2>{result?.score}%</h2>
            <p>
              {result?.passed
                ? "Your learning completion has been recorded."
                : result?.retryAvailable
                  ? "Review the course and retry when you're ready."
                  : "The assessment attempt limit has been reached. Contact your learning owner."}
            </p>
            {result?.passed ? (
              <Button primary href={`/learn/courses/${course._id}/complete`}>
                View completion
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setResult(undefined);
                  setQuestion(0);
                  setAnswers({});
                }}
                disabled={!result?.retryAvailable}
              >
                Review & retry
              </Button>
            )}
          </div>
        </Modal>
      </>
    );
  if (article)
    return (
      <>
        <Back
          href={
            section === "help" ? "/learn/help/articles" : "/learn/knowledge"
          }
        >
          Back to articles
        </Back>
        <PageTitle
          title={article.title || "Knowledge"}
          action={<Badge>Verified</Badge>}
        />
        <div className="nv-grid">
          <Card title={article.title}>
            <article className="nv-article">
              {article.body || article.summary}
            </article>
            <div className="nv-form-actions">
              <Button
                href={`/assistant?prompt=${encodeURIComponent(`Explain this verified article: ${article.title}.`)}`}
              >
                <Sparkles size={13} />
                Ask Kora about this
              </Button>
            </div>
          </Card>
          <div className="nv-stack">
            <Card title="Article details">
              <DetailRows
                rows={[
                  ["Category", label(article.category)],
                  ["Version", `v${article.version}`],
                  ["Published", date(article.publishedAt)],
                  ["Audience", "Internal staff"],
                ]}
              />
            </Card>
            <Card title="Need more help?">
              <p className="nv-caption">
                Include the article and your current screen in a contextual
                support request.
              </p>
              <Button onClick={() => setRequest(true)}>
                Create support request
              </Button>
            </Card>
          </div>
        </div>
        <FormModal
          open={request}
          onClose={() => setRequest(false)}
          title="Request help"
          onSubmit={(b) =>
            m.mutateAsync({
              path: "/requests",
              body: {
                ...b,
                kind: "support",
                reference: `Article: ${article._id}`,
              },
            })
          }
        >
          <Field label="Title" name="title" required />
          <Field
            label="What happened?"
            name="description"
            type="textarea"
            required
          />
        </FormModal>
      </>
    );
  return (
    <>
      <PageTitle
        title={
          section === "courses"
            ? "Courses"
            : section === "knowledge"
              ? "Knowledge"
              : section === "progress"
                ? "My Progress"
                : section === "help"
                  ? id === "requests"
                    ? "Requests & Feedback"
                    : "Help Center"
                  : "Learn"
        }
        description={
          section === "help"
            ? "Everything you need to use NOVYA with confidence."
            : "Verified guidance, practical learning and your personal progress."
        }
        action={
          section === "help" ? (
            <Button onClick={() => setRequest(true)}>
              <Plus size={13} />
              Request help
            </Button>
          ) : (
            <Button href="/learn/progress">My Progress</Button>
          )
        }
      />
      <DataState
        pending={
          courses.isPending || assignments.isPending || knowledge.isPending
        }
        error={courses.error || assignments.error || knowledge.error}
        retry={() => {
          courses.refetch();
          assignments.refetch();
          knowledge.refetch();
        }}
      >
        {section === "courses" ? (
          <>
            <div className="nv-toolbar">
              <SearchBox
                value={term}
                onChange={setTerm}
                placeholder="Search courses..."
              />
              <SelectCourseTabs tab={tab} setTab={setTab} />
            </div>
            {courseCards(
              (courses.data || []).filter(
                (c) =>
                  c.title?.toLowerCase().includes(term.toLowerCase()) &&
                  (tab === "All" ||
                    !!assignments.data?.some(
                      (a) => a.course_id?._id === c._id && a.required,
                    ) ===
                      (tab === "Required")),
              ),
            )}
            {!courses.data?.length && (
              <Card>
                <Empty
                  title="Your next course will appear here"
                  description="Published learning is available when assigned or released to your role."
                />
              </Card>
            )}
          </>
        ) : section === "knowledge" ||
          (section === "help" && id === "articles") ? (
          <>
            <div className="nv-toolbar">
              <SearchBox
                value={term}
                onChange={setTerm}
                placeholder="Search verified guidance..."
              />
            </div>
            {knowledgeList}
          </>
        ) : section === "progress" ? (
          <>
            <Metrics>
              <Metric label="Completion" value={`${pct}%`} />
              <Metric label="In progress" value={pending.length} />
              <Metric label="Completed" value={completed.length} />
              <Metric
                label="Valid certificates"
                value={
                  certificates.data?.filter((c) => c.state === "valid")
                    .length || 0
                }
              />
            </Metrics>
            <div className="nv-grid">
              <Card title="Current learning">
                {assignments.data?.map((a) => (
                  <Link
                    className="nv-list-row"
                    key={a._id}
                    href={`/learn/courses/${a.course_id?._id}`}
                  >
                    <BookOpen size={15} />
                    <div>
                      <strong>{a.course_id?.title}</strong>
                      <small>
                        {a.required ? "Required" : "Optional"} · {date(a.dueAt)}
                      </small>
                      <Progress
                        value={
                          a.course_id?.lessons?.length
                            ? ((a.completedLessons?.length || 0) /
                                a.course_id.lessons.length) *
                              100
                            : 0
                        }
                        tone="green"
                      />
                    </div>
                    <Badge>{a.state}</Badge>
                  </Link>
                ))}
                {!assignments.data?.length && (
                  <Empty
                    title="Start your learning journey"
                    action={
                      <Button href="/learn/courses">Browse courses</Button>
                    }
                  />
                )}
              </Card>
              <Card title="Certificates">
                {certificates.data?.map((c) => (
                  <button
                    className="nv-list-row"
                    style={{ width: "100%", textAlign: "left" }}
                    key={c._id}
                    onClick={() => setCert(c)}
                  >
                    <Award size={17} />
                    <div>
                      <strong>{c.courseKey}</strong>
                      <small>Expires {date(c.expiresAt)}</small>
                    </div>
                    <Badge>{c.state}</Badge>
                  </button>
                ))}
                {!certificates.data?.length && (
                  <Empty
                    title="Your achievements belong here"
                    description="Complete a course to receive its certificate."
                  />
                )}
              </Card>
            </div>
          </>
        ) : section === "help" && id === "requests" ? (
          <Card title="Your support requests">
            <Table headers={["Request", "Type", "Status", "Created"]}>
              {requests.data
                ?.filter((r) => r.kind === "support")
                .map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.title}</strong>
                      <small>{r.description}</small>
                    </td>
                    <td>Support</td>
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                    <td>{date(r.createdAt)}</td>
                  </tr>
                ))}
            </Table>
            {!requests.data?.some((r) => r.kind === "support") && (
              <Empty
                title="No open support requests"
                description="Create a contextual handoff when you need help."
              />
            )}
          </Card>
        ) : section === "help" ? (
          <>
            <div className="nv-toolbar">
              <SearchBox
                value={term}
                onChange={setTerm}
                placeholder="How can we help you?"
              />
              <Button href="/learn/help/requests">My requests</Button>
            </div>
            <div className="nv-course-grid" style={{ marginBottom: 20 }}>
              {[
                "Getting started",
                "Sales & Pipeline",
                "Account & Security",
              ].map((t, i) => (
                <Link
                  className="nv-card-choice"
                  key={t}
                  href="/learn/help/articles"
                >
                  <BookOpen size={25} />
                  <strong>{t}</strong>
                  <p>
                    {
                      [
                        "Find your way around your daily work.",
                        "Understand commercial records and next steps.",
                        "Manage your personal account and preferences.",
                      ][i]
                    }
                  </p>
                  <span className="nv-caption">Browse guidance →</span>
                </Link>
              ))}
            </div>
            {knowledgeList}
          </>
        ) : (
          <>
            <Metrics>
              <Metric
                label="Required learning"
                value={pending.filter((a) => a.required).length}
                detail="Open assignments"
              />
              <Metric
                label="Overdue"
                value={
                  pending.filter(
                    (a) => a.dueAt && new Date(a.dueAt) < new Date(),
                  ).length
                }
              />
              <Metric label="Completion" value={`${pct}%`}>
                <Progress value={pct} tone="green" />
              </Metric>
              <Metric
                label="Certificates"
                value={certificates.data?.length || 0}
              />
            </Metrics>
            <div className="nv-grid">
              <Card
                title="Continue learning"
                description="Pick up from your last confirmed checkpoint."
              >
                {pending.length ? (
                  pending.slice(0, 3).map((a) => (
                    <div key={a._id}>
                      <Badge>{a.required ? "Required" : a.state}</Badge>
                      <h2 style={{ fontSize: 22, margin: "18px 0" }}>
                        {a.course_id?.title}
                      </h2>
                      <Progress
                        value={
                          a.course_id?.lessons?.length
                            ? ((a.completedLessons?.length || 0) /
                                a.course_id.lessons.length) *
                              100
                            : 0
                        }
                        tone="green"
                      />
                      <div className="nv-form-actions">
                        <Button href={`/learn/courses/${a.course_id?._id}`}>
                          Continue learning <ArrowRight size={13} />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty
                    title="Ready for something new?"
                    description="Explore published courses for your role."
                    action={
                      <Button href="/learn/courses">Browse courses</Button>
                    }
                  />
                )}
              </Card>
              <Card title="Your learning path">
                <DetailRows
                  rows={[
                    ["Current assignments", assignments.data?.length || 0],
                    ["Completed", completed.length],
                    ["Still to complete", pending.length],
                    ["Certificates", certificates.data?.length || 0],
                  ]}
                />
                <Button href="/learn/progress">View My Progress</Button>
              </Card>
            </div>
            <div style={{ height: 20 }} />
            <Card title="Knowledge updates">
              <div className="nv-grid-equal">
                {knowledge.data?.slice(0, 4).map((a) => (
                  <Link
                    className="nv-list-row"
                    href={`/learn/knowledge/${a._id}`}
                    key={a._id}
                  >
                    <FileText size={16} />
                    <div>
                      <strong>{a.title}</strong>
                      <small>
                        {label(a.category)} · v{a.version}
                      </small>
                    </div>
                    <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
              {!knowledge.data?.length && (
                <p className="nv-caption">
                  New verified guidance appears here when published.
                </p>
              )}
            </Card>
          </>
        )}
      </DataState>
      <FormModal
        open={request}
        onClose={() => setRequest(false)}
        title="Request help"
        onSubmit={(b) =>
          m.mutateAsync({
            path: "/requests",
            body: {
              ...b,
              kind: "support",
              reference: `/learn/${section}/${id || ""}`,
            },
          })
        }
      >
        <Field label="Title" name="title" required />
        <Field
          label="What happened?"
          name="description"
          type="textarea"
          required
        />
      </FormModal>
      <Modal
        open={!!cert}
        onClose={() => setCert(undefined)}
        title="Learning certificate"
      >
        <div className="nv-certificate">
          <Award size={35} style={{ margin: "auto" }} />
          <p>NOVYA · CERTIFICATE OF COMPLETION</p>
          <h2>{cert?.courseKey}</h2>
          <p>Course version {cert?.courseVersion}</p>
          <DetailRows
            rows={[
              ["Issued", date(cert?.issuedAt)],
              ["Valid until", date(cert?.expiresAt)],
              ["Status", label(cert?.state)],
              ["Certificate ID", cert?._id],
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
function SelectCourseTabs({
  tab,
  setTab,
}: {
  tab: string;
  setTab: (v: string) => void;
}) {
  return (
    <Tabs
      items={["All", "Required", "Optional"]}
      active={tab}
      onChange={setTab}
    />
  );
}
