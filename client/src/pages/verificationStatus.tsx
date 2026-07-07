import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

const VerificationStatus = (): ReactElement => {
  const [searchParams] = useSearchParams()
  const error = searchParams.get("error") == "true"
  const {t} = useTranslation()

  return <h1>{t(`verification.${error ? "failure" : "success"}`)}</h1>
}

export default VerificationStatus