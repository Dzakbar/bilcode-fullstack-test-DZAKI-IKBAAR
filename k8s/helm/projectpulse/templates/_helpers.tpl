{{- define "projectpulse.name" -}}
{{- default .Chart.Name .Values.global.appName | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "projectpulse.labels" -}}
app.kubernetes.io/part-of: {{ .Values.global.partOf | quote }}
{{- end }}

{{- define "projectpulse.backend.matchLabels" -}}
app.kubernetes.io/name: {{ .Values.backend.name | quote }}
{{- end }}

{{- define "projectpulse.backend.labels" -}}
{{ include "projectpulse.backend.matchLabels" . }}
app.kubernetes.io/component: {{ .Values.backend.component | quote }}
{{ include "projectpulse.labels" . }}
{{- end }}

{{- define "projectpulse.web.matchLabels" -}}
app.kubernetes.io/name: {{ .Values.web.name | quote }}
{{- end }}

{{- define "projectpulse.web.labels" -}}
{{ include "projectpulse.web.matchLabels" . }}
app.kubernetes.io/component: {{ .Values.web.component | quote }}
{{ include "projectpulse.labels" . }}
{{- end }}

{{- define "projectpulse.postgres.matchLabels" -}}
app.kubernetes.io/name: {{ .Values.postgres.name | quote }}
{{- end }}

{{- define "projectpulse.postgres.labels" -}}
{{ include "projectpulse.postgres.matchLabels" . }}
app.kubernetes.io/component: {{ .Values.postgres.component | quote }}
{{ include "projectpulse.labels" . }}
{{- end }}
