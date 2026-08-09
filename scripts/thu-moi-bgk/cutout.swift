import Foundation
import Vision
import CoreImage

// cutout <input> <output.png> — tách nền bằng Vision foreground instance mask
let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: cutout <in> <out.png>\n".data(using: .utf8)!)
    exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])

guard let src = CIImage(contentsOf: inURL, options: [.applyOrientationProperty: true]) else {
    FileHandle.standardError.write("cannot read \(inURL.path)\n".data(using: .utf8)!)
    exit(3)
}

let handler = VNImageRequestHandler(ciImage: src, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()

do {
    try handler.perform([req])
    guard let obs = req.results?.first, !obs.allInstances.isEmpty else {
        FileHandle.standardError.write("no foreground instance found\n".data(using: .utf8)!)
        exit(4)
    }
    let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances,
                                          from: handler,
                                          croppedToInstancesExtent: true)
    var out = CIImage(cvPixelBuffer: buf)

    // ảnh gốc chỉ ~480px — phóng to bằng Lanczos cho đủ nét ở khổ poster 1080×1350
    let targetH: CGFloat = args.count >= 4 ? CGFloat(Double(args[3]) ?? 0) : 0
    if targetH > 0 {
        let f = targetH / out.extent.height
        if f > 1 {
            let lz = CIFilter(name: "CILanczosScaleTransform")!
            lz.setValue(out, forKey: kCIInputImageKey)
            lz.setValue(f, forKey: kCIInputScaleKey)
            lz.setValue(1.0, forKey: kCIInputAspectRatioKey)
            if let up = lz.outputImage {
                // làm nét bù độ mềm khi nội suy — phóng càng nhiều thì làm nét càng mạnh
                let sh = CIFilter(name: "CIUnsharpMask")!
                sh.setValue(up, forKey: kCIInputImageKey)
                sh.setValue(min(4.5, 1.6 + f * 0.7), forKey: kCIInputRadiusKey)
                sh.setValue(min(0.75, 0.32 + f * 0.09), forKey: kCIInputIntensityKey)
                out = (sh.outputImage ?? up).cropped(to: up.extent)
            }
        }
    }

    let ctx = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB)!])
    try ctx.writePNGRepresentation(of: out,
                                   to: outURL,
                                   format: .RGBA8,
                                   colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    print("ok \(outURL.lastPathComponent)")
} catch {
    FileHandle.standardError.write("error: \(error)\n".data(using: .utf8)!)
    exit(5)
}
