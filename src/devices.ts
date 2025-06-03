import { Climbro, Entralpi, ForceBoard, Motherboard, mySmartBoard, Progressor, WHC06 } from "@hangtime/grip-connect"
import type { massObject } from "@hangtime/grip-connect/src/interfaces/callback.interface"
import { Chart } from "chart.js/auto"
import { convertFontAwesome } from "./icons"

const connectedDevices: (Climbro | Entralpi | ForceBoard | Motherboard | mySmartBoard | Progressor | WHC06)[] = []

let chartElement: HTMLCanvasElement | null = null
let chart: Chart | null = null
let chartHeight = 0

/**
 * Sets up the device selection functionality and event listeners for streaming, tare, and download actions.
 *
 * @param {HTMLDivElement} massesElement - The HTML element to display mass information.
 * @param {HTMLDivElement} outputElement - The HTML element to display output/erros.
 */
// Contenedor global para mostrar la asimetría
let symmetryDiv: HTMLDivElement | null = null;

export function setupDevice(massesElement: HTMLDivElement, outputElement: HTMLDivElement) {
  let isStreaming = true;
  // Crear el contenedor de asimetría si no existe
  symmetryDiv = document.getElementById('symmetry') as HTMLDivElement;
  if (!symmetryDiv) {
    symmetryDiv = document.createElement('div');
    symmetryDiv.id = 'symmetry';
    symmetryDiv.style.margin = '1rem auto';
    symmetryDiv.style.padding = '1rem';
    symmetryDiv.style.background = '#222';
    symmetryDiv.style.borderRadius = '1rem';
    symmetryDiv.style.color = '#fff';
    symmetryDiv.style.textAlign = 'center';
    symmetryDiv.style.fontWeight = 'bold';
    symmetryDiv.style.maxWidth = '400px';
    symmetryDiv.style.fontSize = '1.2rem';
    massesElement.parentElement?.insertBefore(symmetryDiv, massesElement.nextSibling);
  }
  addNewDeviceSelect();

  /**
   * Function to add a new device select element for selecting another device.
   */
  function addNewDeviceSelect() {
    // Create new device div
    const newDeviceControlDiv = document.createElement("div")
    newDeviceControlDiv.classList.add("input")

    // Create the "Device" select
    const newSelectElement = document.createElement("select")
    newSelectElement.innerHTML = `
      <option value="">Select device</option>
      <option value="progressor">Progressor</option>
      <option value="whc06">WH-C06</option>
    `
    newDeviceControlDiv.appendChild(newSelectElement)

    // Append the new select div to the card container in the DOM
    document.querySelector(".card")?.appendChild(newDeviceControlDiv)

    // Add event listener for the new device select
    newSelectElement.addEventListener("change", () => {
      handleDeviceSelection(newSelectElement)
    })
  }

  function addNewDeviceControl(
    device: Climbro | Entralpi | ForceBoard | Motherboard | mySmartBoard | Progressor | WHC06 | undefined,
  ) {
    // select last input element
    const deviceControlDiv = document.querySelector(".card .input:last-of-type")
    if (deviceControlDiv && device) {
      deviceControlDiv.classList.add(`input-${device.id}`)
      deviceControlDiv.innerHTML = ""

      const deviceName = document.createElement("strong")
      let label = device.constructor.name
      if (connectedDevices.length === 0) {
        label += " (Mano Derecha)"
      } else if (connectedDevices.length === 1) {
        label += " (Mano Izquierda)"
      }
      deviceName.innerHTML = label
      deviceControlDiv.appendChild(deviceName)

      // Create the "Disconnect" button
      const disconnectButton = document.createElement("button")
      disconnectButton.innerHTML = `
    <div>
      <i class="fa-solid fa-link-slash"></i>
    </div>
    <div>Disconnect</div>
  `
      disconnectButton.addEventListener("click", async () => {
        await device.disconnect()
      })
      deviceControlDiv.appendChild(disconnectButton)

      // Create the "Stop" button
      const streamButton = document.createElement("button")
      streamButton.innerHTML = `
    <div>
      <i class="fa-solid fa-stop"></i>
    </div>
    <div>Stop</div>
  `
      streamButton.addEventListener("click", async () => {
        if (isStreaming) {
          streamButton.innerHTML = "<div><i class='fa-solid fa-play'></i></div><div>Start</div>"
          isStreaming = false
          convertFontAwesome()

          if (device instanceof Motherboard || device instanceof Progressor || device instanceof ForceBoard) {
            await device.stop()
          }
        } else {
          streamButton.innerHTML = "<div><i class='fa-solid fa-stop'></i></div><div>Stop</div>"
          isStreaming = true
          convertFontAwesome()
          if (device instanceof Motherboard || device instanceof Progressor || device instanceof ForceBoard) {
            await device.stream()
          }
        }
      })

      deviceControlDiv.appendChild(streamButton)

      // Create the "Tare" button
      const tareButton = document.createElement("button")
      tareButton.innerHTML = `
    <div>
      <i class="fa-solid fa-scale-balanced"></i>
      <small>5 sec</small>
    </div>
    <div>Tare</div>
  `
      tareButton.addEventListener("click", () => {
        device.tare()
      })

      deviceControlDiv.appendChild(tareButton)

      // Create the "Download CSV" button
      const downloadButton = document.createElement("button")
      downloadButton.innerHTML = `
    <div>
      <i class="fa-solid fa-download"></i>
      <small>CSV</small>
    </div>
    <div>Download</div>
  `
      downloadButton.addEventListener("click", () => {
        device.download()
      })

      deviceControlDiv.appendChild(downloadButton)

      // Append the new select div to the card container in the DOM
      document.querySelector(".card")?.appendChild(deviceControlDiv)
      convertFontAwesome()
    }
  }

  // Track mass data for each device
  const deviceMassData: Record<string, massObject> = {}

  /**
   * Adds mass data to the HTML element for each device.
   *
   * @param {string} id - The unique device ID.
   * @param {massObject} data - The mass data object.
   */
  function addMassHTML(id: string | undefined, data: massObject): void {
    if (!id || !massesElement) return;
    deviceMassData[id] = data;
    let deviceDiv = document.getElementById(`device-${id}`);
    if (!deviceDiv) {
      deviceDiv = document.createElement("div");
      deviceDiv.id = `device-${id}`;
      deviceDiv.className = "device-mass";
      massesElement.appendChild(deviceDiv);
    } else {
      deviceDiv.innerHTML = "";
    }
    const deviceIndex = Array.from(massesElement.children).indexOf(deviceDiv);
    let handLabel = "";
    if (deviceIndex === 0) {
      handLabel = "Mano Derecha";
    } else if (deviceIndex === 1) {
      handLabel = "Mano Izquierda";
    } else {
      handLabel = `Dispositivo ${deviceIndex + 1}`;
    }
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    const labelDiv = document.createElement("div");
    labelDiv.style.minWidth = "110px";
    labelDiv.style.fontWeight = "bold";
    labelDiv.textContent = handLabel;
    container.appendChild(labelDiv);
    const valuesDiv = document.createElement("div");
    for (const property in data) {
      if (Object.prototype.hasOwnProperty.call(data, property)) {
        const valueString = data[property as keyof massObject];
        if (valueString !== undefined) {
          const value = parseFloat(valueString);
          if (!isNaN(value)) {
            const label = property.replace("mass", "");
            const valueDiv = document.createElement("div");
            valueDiv.style.marginBottom = "2px";
            valueDiv.innerHTML = `<label>${label}</label> <strong>${value.toFixed(2)}<span> kg</span></strong>`;
            valuesDiv.appendChild(valueDiv);
          }
        }
      }
    }
    container.appendChild(valuesDiv);
    deviceDiv.appendChild(container);
    // --- Lógica de asimetría ---
    if (Object.keys(deviceMassData).length === 2 && symmetryDiv) {
      const ids = Object.keys(deviceMassData);
      const derecha = deviceMassData[ids[0]];
      const izquierda = deviceMassData[ids[1]];
      let result = "<span style='font-size:1.1em;'>\uD83E\uDDE0 Asimetría detectada:</span><br>";
      const keys = ["massMax", "massAverage", "massTotal"];
      keys.forEach(key => {
        const valDer = parseFloat(derecha[key] || "0");
        const valIzq = parseFloat(izquierda[key] || "0");
        if (!isNaN(valDer) && !isNaN(valIzq)) {
          const diff = Math.abs(valDer - valIzq);
          const perc = valDer > 0 ? (diff / valDer) * 100 : 0;
          result += `<b>${key.replace("mass", "")}</b>: diferencia de ${(diff).toFixed(2)} kg (${perc.toFixed(1)}%)<br>`;
        }
      });
      symmetryDiv.innerHTML = result;
    } else if (symmetryDiv) {
      symmetryDiv.innerHTML = "";
    }
}

  /**
   * Handles device selection and connects to the selected device.
   *
   * @param {HTMLSelectElement} selectElement - The device select element.
   */
  function handleDeviceSelection(selectElement: HTMLSelectElement) {
    let device: Climbro | Entralpi | ForceBoard | Motherboard | mySmartBoard | Progressor | WHC06 | null = null
    const selectedDevice = selectElement.value

    if (selectedDevice === "climbro") {
      device = new Climbro()
    } else if (selectedDevice === "entralpi") {
      device = new Entralpi()
    } else if (selectedDevice === "forceboard") {
      device = new ForceBoard()
    } else if (selectedDevice === "motherboard") {
      device = new Motherboard()
    } else if (selectedDevice === "smartboard") {
      device = new mySmartBoard()
    } else if (selectedDevice === "progressor") {
      device = new Progressor()
    } else if (selectedDevice === "whc06") {
      device = new WHC06()
    }

    device?.connect(
      async () => {
        addNewDeviceControl(device)

        connectedDevices.push(device)

        device.notify((data: massObject) => {
          // Chart
          addChartData(device, data.massTotal, data.massMax, data.massAverage)
          chartHeight = Number(data.massMax)
          // HTML
          addMassHTML(device.id, data)
        })

        // Example Reactive check if device is active, optionally using a weight threshold and duration
        device.active(
          (isActive: boolean) => {
            console.log(isActive)
          },
          { threshold: 2.5, duration: 1000 },
        )

        // Display device specific information
        if (
          device instanceof Entralpi ||
          device instanceof ForceBoard ||
          device instanceof Motherboard ||
          device instanceof Progressor
        ) {
          // Show output div for selected devices
          outputElement.style.display = "flex"

          const batteryLevel = await device.battery()
          if (batteryLevel) {
            console.log("Battery Level:", batteryLevel)
            outputElement.textContent += `Battery Level: ${batteryLevel}\r\n`
          }
        }

        if (device instanceof Entralpi || device instanceof Motherboard || device instanceof Progressor) {
          const firmwareRevision = await device.firmware()
          if (firmwareRevision) {
            console.log("Firmware Revision:", firmwareRevision)
            outputElement.textContent += `Firmware Revision: ${firmwareRevision}\r\n`
          }
        }

        if (device instanceof Entralpi || device instanceof ForceBoard || device instanceof Motherboard) {
          const manufacturerName = await device.manufacturer()
          if (manufacturerName) {
            console.log("Manufacturer Name:", manufacturerName)
            outputElement.textContent += `Manufacturer Name: ${manufacturerName}\r\n`
          }
        }

        if (device instanceof Entralpi || device instanceof Motherboard) {
          const hardwareRevision = await device.hardware()
          if (hardwareRevision) {
            console.log("Hardware Revision:", hardwareRevision)
            outputElement.textContent += `Hardware Revision: ${hardwareRevision}\r\n`
          }
        }

        if (device instanceof Entralpi) {
          const modelNumber = await device.model()
          if (modelNumber) {
            console.log("Model Number:", modelNumber)
            outputElement.textContent += `Model Number: ${modelNumber}\r\n`
          }

          const softwareRevision = await device.software()
          if (softwareRevision) {
            console.log("Software Revision:", softwareRevision)
            outputElement.textContent += `Software Revision: ${softwareRevision}\r\n`
          }
        }

        if (device instanceof ForceBoard) {
          const humidityLevel = await device.humidity()
          if (humidityLevel) {
            console.log("Humidity Level:", humidityLevel)
            outputElement.textContent += `Humidity Level: ${humidityLevel}\r\n`
          }
          const temperatureLevel = Number(await device.temperature())
          if (temperatureLevel) {
            const celsius = ((temperatureLevel - 32) * 5) / 9
            console.log("Temperature Level Fahrenheit:", temperatureLevel.toString())
            console.log("Temperature Level in Celsius:", celsius.toFixed(1))
            outputElement.textContent += `Temperature Level: ${temperatureLevel.toString()}°F / ${celsius.toFixed(
              1,
            )}°C\r\n`
          }
        }

        if (device instanceof Motherboard) {
          const storedText = await device.text()
          if (storedText) {
            console.log("Stored Text:", storedText)
            outputElement.textContent += `Stored Text: ${storedText}\r\n`
          }

          const serialNumber = await device.serial()
          if (serialNumber) {
            console.log("Serial Number:", serialNumber)
            outputElement.textContent += `Serial Number: ${serialNumber}\r\n`
          }
        }
        // outputElement.style.display = "none"

        // Trigger LEDs
        if (device instanceof Motherboard) {
          await device.led("green")
          await device.led("red")
          await device.led("orange")
          await device.led()
        }

        // Start streaming
        if (device instanceof Motherboard || device instanceof Progressor || device instanceof ForceBoard) {
          await device.stream()
        }

        if (
          device instanceof Entralpi ||
          // TODO:device instanceof ForceBoard ||
          device instanceof Motherboard ||
          device instanceof Progressor ||
          device instanceof WHC06
        ) {
          isStreaming = true
        }
        addNewDeviceSelect()
      },
      (error: Error) => {
        outputElement.innerHTML = error.message
        outputElement.style.display = "flex"
      },
    )
  }
}

// Map to store dataset indices by device ID
const deviceDatasets: Record<string, { totalIndex: number; maxIndex: number; averageIndex: number }> = {}

/**
 * Sets up the chart with the provided HTML canvas element.
 *
 * @param {HTMLCanvasElement} element - The HTML canvas element for the chart.
 */
export function setupChart(element: HTMLCanvasElement) {
  chartElement = element
  if (chartElement) {
    chart = new Chart(chartElement, {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        elements: {
          point: {
            radius: 0,
          },
        },
        plugins: {
          legend: {
            // display: false,
          },
          tooltip: {},
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            min: 0,
            max: 100,
          },
        },
      },
    })
  }
}

/**
 * Adds new data to the chart for a specific device.
 *
 * @param {Climbro | Entralpi | ForceBoard | Motherboard | mySmartBoard | Progressor | WHC06} device - The device.
 * @param {string} mass - The total mass data.
 * @param {string} max - The maximum mass data.
 * @param {string} average - The average mass data.
 */
function addChartData(
  device: Climbro | Entralpi | ForceBoard | Motherboard | mySmartBoard | Progressor | WHC06,
  mass: string,
  max: string,
  average: string,
) {
  if (chart && device !== undefined) {
    const numericMass = parseFloat(mass)
    const numericMax = parseFloat(max)
    const numericAverage = parseFloat(average)

    if (!isNaN(numericMass) && !isNaN(numericMax) && !isNaN(numericAverage)) {
      const label = new Date().toLocaleTimeString() // Example label

      // Add label to all datasets
      chart.data.labels?.push(label)
      if (chart.data.labels && chart.data.labels.length >= 100) {
        chart.data.labels.shift()
      }

      // Check if we have datasets for this device ID
      if (device.id && !deviceDatasets[device.id]) {
        // If not, create the datasets for this device
        let colorSet = {
          total: "#36a2eb", // blue
          max: "#ff6383",   // pink
          average: "#ff9f40" // orange
        }
        // Assign different colors for Mano Izquierda (second device)
        if (Object.keys(deviceDatasets).length === 1) {
          colorSet = {
            total: "#e74c3c", // red
            max: "#8e44ad",   // purple
            average: "#f1c40f" // yellow
          }
        }
        const totalDataset = {
          label: `${device.constructor.name} Total`,
          data: [],
          borderWidth: 3,
          backgroundColor: colorSet.total,
          borderColor: colorSet.total,
        }

        const maxDataset = {
          label: `${device.constructor.name} Max`,
          data: [],
          fill: false,
          borderWidth: 3,
          backgroundColor: colorSet.max,
          borderColor: colorSet.max,
        }

        const averageDataset = {
          label: `${device.constructor.name} Average`,
          data: [],
          fill: false,
          borderDash: [5, 5],
          borderWidth: 3,
          backgroundColor: colorSet.average,
          borderColor: colorSet.average,
        }

        // Add datasets to the chart
        chart.data.datasets.push(totalDataset, maxDataset, averageDataset)

        // Store the indices of the datasets for this device
        deviceDatasets[device.id] = {
          totalIndex: chart.data.datasets.length - 3,
          maxIndex: chart.data.datasets.length - 2,
          averageIndex: chart.data.datasets.length - 1,
        }
      }

      if (device.id) {
        // Retrieve the dataset indices for this device
        const { totalIndex, maxIndex, averageIndex } = deviceDatasets[device.id]

        // Update the datasets with new data
        chart.data.datasets[totalIndex].data.push(numericMass)
        chart.data.datasets[maxIndex].data.push(numericMax)
        chart.data.datasets[averageIndex].data.push(numericAverage)

        // Ensure dataset length doesn't exceed 100 entries
        if (chart.data.datasets[totalIndex].data.length >= 100) {
          chart.data.datasets[totalIndex].data.shift()
        }
        if (chart.data.datasets[maxIndex].data.length >= 100) {
          chart.data.datasets[maxIndex].data.shift()
        }
        if (chart.data.datasets[averageIndex].data.length >= 100) {
          chart.data.datasets[averageIndex].data.shift()
        }
      }

      // Optionally update the y-axis max value
      if (chart.options.scales?.y) {
        chart.options.scales.y.max = Math.ceil((chartHeight + 10) / 10) * 10
      }

      chart.update()
    } else {
      console.error("Invalid numeric data:", mass, max, average)
    }
  }
}
