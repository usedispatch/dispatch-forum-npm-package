import { useEffect, useState } from 'react'

interface Props {
  type?: 'text' | 'number'
  value?: string | number
  onChange: (value: any) => void
  min?: number
  max?: number
  step?: number | 'any'
  placeholder?: string
  className?: string
}

const Input = ({
  type,
  value,
  min,
  max,
  step,
  placeholder,
  className,
  onChange,
}: Props) => {
  const [textValue, setTextValue] = useState(Number.isNaN(value) ? '' : value)

  const formatText = (e: any) => {
    if (type === 'text') return

    const NUMBER_DOT_COMMA = /^[\d,.]*$/
    const fieldValue = e.target.value
    const fieldHasCommaOrDot =
      fieldValue.includes('.') || fieldValue.includes(',')
    const keyIsCommaOrDot = e.key === '.' || e.key === ','

    if (
      !NUMBER_DOT_COMMA.test(e.key) ||
      (keyIsCommaOrDot && fieldHasCommaOrDot)
    )
      e.preventDefault()
    e.target.value = fieldValue.replace(',', '.')
  }

  const onTextChange = (e: any) => {
    console.log(e.target.value)
    setTextValue(e.target.value)

    if (type === 'number' && parseFloat(e.target.value) !== NaN) {
      return onChange(parseFloat(e.target.value))
    }

    return onChange(e.target.value)
  }

  useEffect(() => {
    setTextValue(Number.isNaN(value) ? '' : value)
  }, [value])

  return (
    <>
      <input
        type="text"
        placeholder={placeholder}
        step={type === 'number' ? step || 'any' : undefined}
        min={min}
        max={max}
        value={textValue}
        onKeyPress={formatText}
        onChange={onTextChange}
        className={className}
      />
    </>
  )
}

export default Input
